import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const components = await readFile(
  new URL('../../src/css/components.css', import.meta.url),
  'utf8',
);
const base = await readFile(
  new URL('../../src/css/base.css', import.meta.url),
  'utf8',
);
const entry = await readFile(
  new URL('../../src/css/index.css', import.meta.url),
  'utf8',
);
const oatTheme = await readFile(
  new URL('../../src/css/oat-theme.css', import.meta.url),
  'utf8',
);

test('CSS preserves framework-agnostic, semantic primitive selectors', () => {
  for (const selector of [
    '.rc-button',
    '.rc-field',
    '.rc-radio-cards',
    '.rc-radio-card',
    'ot-tabs.rc-tabs',
    '.rc-dialog',
    '.rc-combobox',
    '.rc-searchable-dropdown',
    'details.rc-expansion',
    '.rc-table',
    '.rc-breadcrumbs',
  ]) {
    assert.match(components, new RegExp(selector.replaceAll('.', '\\.')));
  }
});

test('semantic state attributes map to visible component states', () => {
  for (const contract of [
    `[data-variant='primary']`,
    `[data-state='disabled']`,
    `[data-state='preparing']`,
    `[data-state='success']`,
    `[data-state='warning']`,
    `[data-state='error']`,
    `[aria-busy='true']`,
    `[aria-invalid='true']`,
    `[aria-disabled='true']`,
  ]) {
    assert.ok(
      components.includes(contract),
      `Missing state contract ${contract}`,
    );
  }
});

test('CSS layers the pinned Oat foundation below Reclaim and bridges semantic tokens', () => {
  assert.match(entry, /\.\.\/oat\/index\.css/);
  assert.match(entry, /layer\(oat\)/);
  assert.match(oatTheme, /--background: var\(--rc-color-surface-canvas\)/);
  assert.match(oatTheme, /--radius-medium: var\(--rc-radius-container\)/);
  assert.match(
    oatTheme,
    /\[data-theme=['"]dark['"]\]\s*\{\s*color-scheme: dark/,
  );
});

test('CSS consumes semantic design tokens and provides a visible focus treatment', () => {
  assert.match(components, /--rc-color-action-primary/);
  assert.match(components, /--rc-color-border-spec/);
  assert.match(base, /:focus-visible/);
  assert.match(base, /--rc-color-focus-ring/);
});
