import test from 'node:test';
import assert from 'node:assert/strict';
import { credentialPathSignal } from './candidate-path-signal.js';
test('Matches bounded credential terms, including percent-encoded paths', () => {
  for (const url of ['https://example.com/login', 'https://example.com/account/sign-in', 'https://example.com/%76erify', 'https://example.com/PASSWORD/reset']) assert.equal(credentialPathSignal(url), true);
});
test('Ignores substrings and terms outside the path', () => {
  for (const url of ['https://login.example.com/', 'https://example.com/?next=login', 'https://example.com/#password', 'https://example.com/loginfo', 'https://example.com/passwordless']) assert.equal(credentialPathSignal(url), false);
});
test('Handles malformed or unsupported inputs and shows benign ambiguity', () => {
  for (const url of ['bad','file:///login','https://example.com/%ZZ']) assert.equal(credentialPathSignal(url), false);
  assert.equal(credentialPathSignal('https://example.com/help/password'), true);
});
