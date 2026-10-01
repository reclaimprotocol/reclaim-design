import assert from 'node:assert/strict';
import test from 'node:test';
import {
  filterOptionText,
  getCopyValue,
  isActivationKey,
  nextTheme,
  normalizeTheme,
} from '../../dist/behaviors/core.js';
import {milliseconds} from '../../dist/behaviors/index.js';

test('theme helpers only accept supported themes', () => {
  assert.equal(normalizeTheme('dark'), 'dark');
  assert.equal(normalizeTheme('unknown', 'dark'), 'dark');
  assert.equal(nextTheme('light'), 'dark');
  assert.equal(nextTheme('dark'), 'light');
});

test('combobox filtering is case-insensitive and data-safe', () => {
  assert.deepEqual(filterOptionText([{text: 'Europe'}, {text: 'Asia'}], 'EU'), [
    {text: 'Europe'},
  ]);
  assert.equal(filterOptionText(['Asia'], '').length, 1);
});

test('copy and keyboard helpers keep behavior deterministic', () => {
  assert.equal(getCopyValue({text: '  proof  '}), 'proof');
  assert.equal(getCopyValue({sourceText: ' value '}), 'value');
  assert.equal(isActivationKey('Enter'), true);
  assert.equal(isActivationKey('Escape'), false);
});

test('loading timing accepts the token duration syntax', () => {
  assert.equal(milliseconds('300ms'), 300);
  assert.equal(milliseconds('0.5s'), 500);
});
