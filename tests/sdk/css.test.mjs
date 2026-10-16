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
    '.rc-page',
    '.rc-pill',
    '.rc-kind-tag',
    '.rc-search',
    '.rc-input-group',
    '.rc-field-grid',
    'table.rc-table',
    '.rc-card__header',
    '.rc-pool',
    '.rc-plan',
    '.rc-chart-frame',
    '.rc-hint',
    '.rc-event-timeline__row',
    '.rc-wordmark',
    '[popover]',
    '[data-copy-done]',
    '.rc-flow-shell',
    '.rc-field__hint',
    '.rc-selection-dialog',
    '.rc-switcher-dropdown__action',
    '.rc-link-card',
    '.rc-selection-bar',
    '.rc-notice',
    '.rc-app-bar__nav',
    '.rc-flow-shell__subject',
    '.rc-chart-plot',
    '.rc-bar-chart',
    '.rc-area-chart',
    '.rc-bar-list',
    '.rc-chart-legend',
    '.rc-table-scroll[data-bordered]',
    '.rc-dialog > form',
  ]) {
    assert.match(components, new RegExp(selector.replace(/[.[\]]/g, '\\$&')));
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

test('component tokens drive button, field, and card sizing', () => {
  for (const variable of [
    '--rc-component-button-height',
    '--rc-component-field-height',
    '--rc-component-card-padding',
  ]) {
    assert.ok(components.includes(`var(${variable})`), variable);
  }
});

test('the bottom tab bar has one hidden default and one compact block', () => {
  assert.equal((components.match(/^\s*\.rc-bottom-tabs \{/gm) ?? []).length, 2);
  assert.equal((components.match(/!important/g) ?? []).length, 1);
});

test('card headers, selects, segments, icon-only buttons, and chips follow the console contract', () => {
  for (const contract of [
    /\.rc-card\[data-tone='danger'\] :is\(h2, h3, \.rc-plan__name\)/,
    /\.rc-card__header \{[^}]*min-block-size: calc\(\s*var\(--rc-space-175\) \* 2 \+ var\(--rc-size-header-row\)/,
    /\.rc-chart-frame__header :is\(h2, h3\) \{[^}]*--rc-size-header-row/,
    /\.rc-numbered-step h2 \{[^}]*--rc-size-header-row/,
    /\.rc-input,\s*\.rc-select,\s*\.rc-textarea \{\s*background-color:/,
    /\.rc-select \{\s*padding-inline-end: var\(--rc-size-select-arrow\)/,
    /\.rc-segments:not\(\[data-width\]\) \{\s*justify-self: start/,
    /\.rc-button\[data-icon-only\] \{[^}]*inline-size: var\(--rc-component-button-height\)/,
    /\.rc-chip \{[^}]*min-block-size: var\(--rc-size-control-md\)/,
    /\.rc-nav-link:has\(> small\) \{\s*min-block-size: var\(--rc-size-nav-item-count\)/,
    /\.rc-switcher-dropdown__trigger \{[^}]*min-block-size: var\(--rc-size-switcher\)/,
    /\.rc-switcher-dropdown__menu :is\(button, a\) \{[^}]*min-block-size: var\(--rc-size-menu-row\)/,
    /\.rc-kpi-grid \{[^}]*margin-block-end: var\(--rc-space-3\)/,
  ]) {
    assert.match(components, contract);
  }
});
