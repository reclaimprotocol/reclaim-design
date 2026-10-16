import assert from 'node:assert/strict';
import test from 'node:test';
import {icon, icons} from '../dist/icons/index.js';

test('icons are decorative by default', () => {
  assert.match(icons.copy, /aria-hidden="true"/);
  assert.match(icons.copy, /stroke-width="1.5"/);
});

test('labeled icons expose an accessible image', () => {
  const labeled = icon('shieldCheck', 'Proof & "claim"');
  assert.match(labeled, /role="img"/);
  assert.match(labeled, /Proof &amp; &quot;claim&quot;/);
  assert.doesNotMatch(labeled, /aria-hidden/);
});

test('unknown icons fail loudly', () => {
  assert.throws(() => icon('missing'), /Unknown Reclaim icon/);
});

test('console icons use the shared stroke API', () => {
  for (const name of [
    'grid',
    'activity',
    'cube',
    'apps',
    'link',
    'users',
    'card',
    'sliders',
    'terminal',
    'book',
    'externalLink',
    'upDown',
    'chevronDown',
    'chevronUp',
    'plus',
    'pencil',
    'logout',
    'globe',
    'barChart',
    'flag',
    'inbox',
    'more',
    'sparkle',
    'warning',
  ]) {
    assert.match(icon(name), /stroke-width="1.5"/, name);
  }
});
