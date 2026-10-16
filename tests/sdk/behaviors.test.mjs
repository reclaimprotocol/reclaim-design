import assert from 'node:assert/strict';
import test from 'node:test';
import {
  filterOptionText,
  getCopyValue,
  isActivationKey,
  nextTheme,
  normalizeTheme,
} from '../../dist/behaviors/core.js';
import {
  createThemeController,
  milliseconds,
} from '../../dist/behaviors/index.js';

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

test('theme controller follows the system theme until a theme is saved', () => {
  const target = {dataset: {}};
  const root = {
    querySelector: () => target,
    querySelectorAll: () => [],
    addEventListener() {},
    removeEventListener() {},
  };
  const listeners = [];
  const query = {
    matches: true,
    addEventListener: (_, listener) => listeners.push(listener),
    removeEventListener() {},
  };
  const original = globalThis.matchMedia;
  globalThis.matchMedia = () => query;
  try {
    const saved = {getItem: () => 'light', setItem() {}};
    createThemeController(root, {storage: saved, followSystem: true});
    assert.equal(target.dataset.theme, 'light');

    const controller = createThemeController(root, {
      storage: {getItem: () => null, setItem() {}},
      followSystem: true,
    });
    assert.equal(target.dataset.theme, 'dark');
    query.matches = false;
    listeners.forEach(listener => listener());
    assert.equal(target.dataset.theme, 'light');
    controller.destroy();
  } finally {
    globalThis.matchMedia = original;
  }
});
