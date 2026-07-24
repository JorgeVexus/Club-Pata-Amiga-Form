import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const migrationPath = path.join(root, 'supabase/migrations/20260718_pet_unsubscription_workflow_and_solidarity_cycle.sql');
const servicePath = path.join(root, 'src/services/pet-unsubscription.service.ts');
const userRoutePath = path.join(root, 'src/app/api/user/pets/unsubscribe/route.ts');
const adminListPath = path.join(root, 'src/app/api/admin/pet-unsubscriptions/route.ts');
const adminReviewPath = path.join(root, 'src/app/api/admin/pet-unsubscriptions/[id]/route.ts');
const adminDashboardPath = path.join(root, 'src/components/Admin/AdminDashboard.tsx');

test('pet unsubscription migration defines review states and one pending request per pet', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');

  assert.match(sql, /ADD COLUMN IF NOT EXISTS status text/);
  assert.match(sql, /CHECK \(status IN \('pending', 'approved', 'rejected'\)\)/);
  assert.match(sql, /WHERE status = 'pending'/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS first_payment_at timestamptz/);
  assert.match(sql, /UPDATE public\.pet_unsubscriptions[\s\S]*status = 'approved'/);
});

test('admin routes authenticate and expose the pending review queue', () => {
  const listSource = fs.readFileSync(adminListPath, 'utf8');
  const reviewSource = fs.readFileSync(adminReviewPath, 'utf8');
  assert.match(listSource, /getAdminUser/);
  assert.match(listSource, /\.eq\('status', 'pending'\)/);
  assert.match(reviewSource, /approvePetUnsubscription/);
  assert.match(reviewSource, /rejectPetUnsubscription/);
  assert.match(reviewSource, /createServerNotification/);
});

test('pet unsubscription service exposes pending, approve, reject and immediate workflows', () => {
  const source = fs.readFileSync(servicePath, 'utf8');

  assert.match(source, /export async function createPetUnsubscriptionRequest/);
  assert.match(source, /export async function approvePetUnsubscription/);
  assert.match(source, /export async function rejectPetUnsubscription/);
  assert.match(source, /export async function executeImmediatePetUnsubscription/);
  assert.match(source, /\.eq\('status', 'pending'\)/);
  assert.match(source, /pet-\$\{petNum\}-is-active/);
});

test('pet deactivation uses is_active and audit metadata without writing unsupported pet status', () => {
  const source = fs.readFileSync(servicePath, 'utf8');
  const deactivateStart = source.indexOf('async function deactivatePet');
  const deactivateEnd = source.indexOf('export async function executeImmediatePetUnsubscription', deactivateStart);

  assert.ok(deactivateStart > -1, 'deactivatePet should exist');
  assert.ok(deactivateEnd > deactivateStart, 'deactivatePet block should be bounded');

  const deactivateSource = source.slice(deactivateStart, deactivateEnd);
  assert.match(deactivateSource, /is_active:\s*false/);
  assert.match(deactivateSource, /unsubscribed_reason:\s*reason/);
  assert.doesNotMatch(
    deactivateSource,
    /status:\s*'unsubscribed'/,
    'production pets_status_check does not allow unsubscribed as a pet status'
  );
});

test('member unsubscribe route creates pending requests but keeps immediate admin and death flows', () => {
  const source = fs.readFileSync(userRoutePath, 'utf8');

  assert.match(source, /authorizedAdmin \|\| isDeathSolidarity/);
  assert.match(source, /createPetUnsubscriptionRequest/);
  assert.match(source, /executeImmediatePetUnsubscription/);
  assert.match(source, /status:\s*'pending'/);
});

test('member unsubscribe route notifies admins and routes them to the pending unsubscription queue', () => {
  const source = fs.readFileSync(userRoutePath, 'utf8');
  const dashboardSource = fs.readFileSync(adminDashboardPath, 'utf8');

  assert.match(source, /createServerNotification/);
  assert.match(source, /userId:\s*'admin'/);
  assert.match(source, /type:\s*'pet_unsubscription_requested'/);
  assert.match(source, /link:\s*`\/admin\/dashboard\?tab=pet-unsubscriptions/);
  assert.match(source, /action:\s*'open_pet_unsubscriptions'/);
  assert.match(source, /petUnsubscriptionId:\s*pendingRequest\.id/);

  assert.match(dashboardSource, /open_pet_unsubscriptions/);
  assert.match(dashboardSource, /setActiveFilter\('pet-unsubscriptions'\)/);
});

test('admin approval notifies the member that a new pet slot was released', () => {
  const source = fs.readFileSync(adminReviewPath, 'utf8');

  assert.match(source, /type:\s*'pet_status'/);
  assert.match(source, /title:\s*action === 'approve' \? 'Espacio liberado en tu membresía'/);
  assert.match(source, /se liberó un espacio para otro peludito en tu membresía/);
  assert.match(source, /metadata:\s*\{[\s\S]*source:\s*'pet_unsubscription_review'/);
  assert.match(source, /action:\s*action === 'approve' \? 'open_add_pet'/);
});
