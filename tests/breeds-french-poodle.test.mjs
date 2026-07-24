import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const breeds = JSON.parse(readFileSync('src/data/breeds.json', 'utf8'));
const dogs = Array.isArray(breeds.perros) ? breeds.perros : [];
const frenchPoodle = dogs.find(item => String(item.name).toLowerCase() === 'french poodle');

assert.ok(frenchPoodle, 'French poodle should exist in dog breeds seed catalog');
assert.equal(frenchPoodle.hasGeneticIssues, false);
assert.equal(frenchPoodle.size, 'Pequeño');

console.log('French poodle breed seed check passed');
