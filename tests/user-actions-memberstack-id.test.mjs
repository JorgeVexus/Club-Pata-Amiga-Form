import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/app/actions/user.actions.ts', import.meta.url), 'utf8');

test('getPetsByUserId resolves the real Memberstack id when called with a Supabase UUID', () => {
  assert.match(
    source,
    /\.select\('id, memberstack_id, first_name, last_name, last_admin_response, action_required_fields, membership_status'\)/,
    'the primary user lookup must include memberstack_id',
  );
  assert.match(
    source,
    /\.select\('id, memberstack_id, first_name, last_name'\)/,
    'the fallback user lookup must include memberstack_id',
  );
  assert.match(
    source,
    /const realMemberstackId = userData\.memberstack_id \|\| memberstackId;/,
    'the action must resolve the real Memberstack id from the Supabase user row',
  );
  assert.match(
    source,
    /getMemberDetails\(realMemberstackId\)/,
    'Memberstack details must be fetched with the resolved Memberstack id',
  );
  assert.match(
    source,
    /\.eq\('user_id', realMemberstackId\)/,
    'appeal logs must be queried with the resolved Memberstack id',
  );
  assert.equal(
    [...source.matchAll(/\.eq\('memberstack_id', realMemberstackId\)/g)].length >= 2,
    true,
    'all pet unsubscription lookups must use the resolved Memberstack id',
  );
});
