import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const entryTypes = await readFile('dist/index.d.ts', 'utf8');
const contractTypes = await readFile('dist/contracts.d.ts', 'utf8');
const catalog = await readFile('apps/catalog/src/main.tsx', 'utf8');

test('the root entry exposes framework-neutral DOM and event contracts', () => {
  assert.match(entryTypes, /export \* from ['"]\.\/contracts\.js['"]/);
  for (const name of [
    'ReclaimState',
    'ReclaimVariant',
    'ReclaimStateAttributes',
    'ReclaimValueChangeDetail',
    'ReclaimSegmentChangeDetail',
    'OatTabChangeDetail',
    'OatTabsElement',
  ]) {
    assert.match(contractTypes, new RegExp(`(type|interface) ${name}`));
  }
});

test('behavior entry exposes controller interfaces instead of framework props', async () => {
  const behaviorTypes = await readFile('dist/behaviors/index.d.ts', 'utf8');
  for (const name of [
    'ReclaimController',
    'ThemeController',
    'LoadingController',
    'DismissibleOverlayControllerOptions',
  ]) {
    assert.match(behaviorTypes, new RegExp(`interface ${name}`));
  }
});

test('the catalog demonstrates semantic selection and Oat tabs', () => {
  assert.match(catalog, /className="catalog-selection-dropdown"/);
  assert.match(catalog, /<Dropdown/);
  assert.match(catalog, /className="rc-radio-cards"/);
  assert.match(catalog, /createElement\(\s*['"]ot-tabs['"]/);
  assert.match(catalog, /@reclaimprotocol\/design\/oat/);
});
