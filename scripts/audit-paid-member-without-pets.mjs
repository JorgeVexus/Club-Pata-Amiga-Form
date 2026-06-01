import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

function loadLocalEnv() {
  for (const fileName of ['.env.local', '.env']) {
    const filePath = resolve(process.cwd(), fileName);
    if (!existsSync(filePath)) continue;

    const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const equalsIndex = trimmed.indexOf('=');
      if (equalsIndex === -1) continue;

      const key = trimmed.slice(0, equalsIndex).trim();
      let value = trimmed.slice(equalsIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

loadLocalEnv();

const emails = process.argv.slice(2).map((email) => email.trim().toLowerCase()).filter(Boolean);

if (emails.length === 0) {
  console.error('Usage: node scripts/audit-paid-member-without-pets.mjs email@example.com [more@email.com]');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const memberstackKey = process.env.MEMBERSTACK_ADMIN_SECRET_KEY;
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const stripe = stripeKey ? new Stripe(stripeKey) : null;

async function getMemberstackMemberByEmail(email) {
  if (!memberstackKey) return null;

  let after = null;
  for (let page = 0; page < 20; page += 1) {
    const url = new URL('https://admin.memberstack.com/members');
    url.searchParams.set('limit', '100');
    if (after) url.searchParams.set('after', after);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': memberstackKey,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Memberstack error ${response.status}: ${text}`);
    }

    const body = await response.json();
    const member = (body.data || []).find((item) => item.auth?.email?.toLowerCase() === email);
    if (member) return member;

    if (!body.hasNextPage || !body.endCursor) break;
    after = body.endCursor;
  }

  return null;
}

async function getMemberstackMemberById(memberId) {
  if (!memberstackKey || !memberId) return null;

  const response = await fetch(`https://admin.memberstack.com/members/${encodeURIComponent(memberId)}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': memberstackKey,
    },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Memberstack member error ${response.status}: ${text}`);
  }

  const body = await response.json();
  return body.data || body;
}

function extractPetCandidatesFromUser(user) {
  const candidates = [];
  if (user?.pet_name || user?.pet_type || user?.pet_age) {
    candidates.push({
      source: 'supabase.users pet_* columns',
      slot: 1,
      name: user.pet_name || '',
      petType: user.pet_type || '',
      age: user.pet_age || '',
      ageUnit: user.pet_age_unit || '',
    });
  }
  return candidates;
}

function extractPetCandidatesFromMemberstack(member) {
  const fields = member?.customFields || {};
  const candidates = [];

  for (let slot = 1; slot <= 3; slot += 1) {
    const name = fields[`pet-${slot}-name`];
    const type = fields[`pet-${slot}-type`];
    const age = fields[`pet-${slot}-age`];
    const ageUnit = fields[`pet-${slot}-age-unit`];
    if (name || type || age) {
      candidates.push({
        source: 'memberstack customFields pet-N-*',
        slot,
        name: name || '',
        petType: type || '',
        age: age || '',
        ageUnit: ageUnit || '',
      });
    }
  }

  if (candidates.length === 0 && (fields['pet-name'] || fields['pet-type'] || fields['pet-age'])) {
    candidates.push({
      source: 'memberstack customFields legacy pet-*',
      slot: 1,
      name: fields['pet-name'] || '',
      petType: fields['pet-type'] || '',
      age: fields['pet-age'] || '',
      ageUnit: fields['pet-age-unit'] || '',
    });
  }

  return candidates;
}

async function getStripeSummary(email) {
  if (!stripe) return { configured: false };

  const customers = await stripe.customers.list({ email, limit: 10 });
  const summaries = [];

  for (const customer of customers.data) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'all',
      limit: 10,
    });
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customer.id,
      limit: 10,
    });
    const sessions = await stripe.checkout.sessions.list({
      customer: customer.id,
      limit: 10,
    });

    summaries.push({
      customerId: customer.id,
      customerEmail: customer.email,
      subscriptions: subscriptions.data.map((sub) => ({
        id: sub.id,
        status: sub.status,
        created: new Date(sub.created * 1000).toISOString(),
      })),
      successfulPayments: paymentIntents.data
        .filter((intent) => intent.status === 'succeeded')
        .map((intent) => ({
          id: intent.id,
          amount: intent.amount,
          currency: intent.currency,
          created: new Date(intent.created * 1000).toISOString(),
        })),
      checkoutSessions: sessions.data.map((session) => ({
        id: session.id,
        status: session.status,
        paymentStatus: session.payment_status,
        successUrl: session.success_url,
        cancelUrl: session.cancel_url,
        created: new Date(session.created * 1000).toISOString(),
      })),
    });
  }

  return { configured: true, customers: summaries };
}

for (const email of emails) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  const memberById = await getMemberstackMemberById(user?.memberstack_id);
  const member = memberById || await getMemberstackMemberByEmail(email);
  const memberstackId = user?.memberstack_id || member?.id || null;

  let pets = [];
  if (user?.id) {
    const { data: petsData, error: petsError } = await supabase
      .from('pets')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: true });
    if (petsError) throw petsError;
    pets = petsData || [];
  }

  const candidatePets = [
    ...extractPetCandidatesFromUser(user),
    ...extractPetCandidatesFromMemberstack(member),
  ];

  const stripeSummary = await getStripeSummary(email);

  const report = {
    email,
    supabaseUserFound: !!user,
    supabaseUserError: userError?.message || null,
    memberstackFound: !!member,
    memberstackId,
    registrationStep: user?.registration_step || member?.customFields?.['registration-step'] || null,
    membershipStatus: user?.membership_status || null,
    paymentStatus: member?.customFields?.['payment-status'] || null,
    checkoutPending: member?.customFields?.['checkout-pending'] || null,
    memberstackPlanConnections: member?.planConnections || [],
    petsInSupabaseCount: pets.length,
    petsInSupabase: pets.map((pet) => ({
      id: pet.id,
      name: pet.name,
      petType: pet.pet_type,
      status: pet.status,
      createdAt: pet.created_at,
      memberstackSlot: pet.memberstack_slot,
    })),
    candidatePets,
    recoveryRecommendation:
      pets.length > 0
        ? 'No recovery needed: pets table has records.'
        : candidatePets.length > 0
          ? 'Recoverable: create pets rows from candidatePets after manual validation.'
          : 'Not recoverable from app records: contact customer or inspect external CRM/webflow logs.',
    stripeSummary,
  };

  console.log(JSON.stringify(report, null, 2));
}
