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

test('member unsubscribe route creates pending requests but keeps immediate admin and death flows', () => {
  const source = fs.readFileSync(userRoutePath, 'utf8');

  assert.match(source, /authorizedAdmin \|\| isDeathSolidarity/);
  assert.match(source, /createPetUnsubscriptionRequest/);
  assert.match(source, /executeImmediatePetUnsubscription/);
  assert.match(source, /status:\s*'pending'/);
});
