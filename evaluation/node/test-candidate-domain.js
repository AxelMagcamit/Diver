import test from 'node:test';
import assert from 'node:assert/strict';
import { embeddedDomainSignal } from './candidate-domain-signal.js';
test('Detects embedded domain with hostname boundaries and suffix context', () => {
  for (const url of ['https://paypal.com.example.org/', 'https://secure.paypal.com.example.co.uk/', 'https://PAYPAL.COM.example.org./', 'https://paypal.com.tenant.github.io/']) assert.equal(embeddedDomainSignal(url),true);
});
test('Does not match the real domain, subdomains or non-host references', () => {
  for (const url of ['https://paypal.com/', 'https://www.paypal.com./', 'https://example.org/paypal.com/', 'https://example.org/?next=paypal.com', 'https://paypal.com@example.org/', 'https://notpaypal.com.example.org/']) assert.equal(embeddedDomainSignal(url),false);
});
test('Rejects unsupported input and documents deliberate narrow coverage', () => {
  for (const url of ['bad','file://paypal.com.example.org/x', 'https://paypal-login.example.org/', 'https://paypa1.com.example.org/']) assert.equal(embeddedDomainSignal(url),false);
});
