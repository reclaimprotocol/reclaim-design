import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const vendorRecord = await readFile(
  new URL('../../vendor/oat/VENDOR.md', import.meta.url),
  'utf8',
);
const entry = await readFile(
  new URL('../../src/oat/index.css', import.meta.url),
  'utf8',
);
const license = await readFile(
  new URL('../../vendor/oat/LICENSE.oat', import.meta.url),
  'utf8',
);

test('the Oat fork is pinned and retains its license', () => {
  assert.match(vendorRecord, /32955ad1b65be51f13bc6be802611de80db9e357/);
  assert.match(license, /MIT License/);
  assert.match(license, /Kailash Nadh/);
});

test('the aggregate stylesheet includes the required base and component modules', () => {
  for (const module of [
    '00-base',
    '01-theme',
    'button',
    'form',
    'accordion',
    'tabs',
    'dialog',
    'toast',
    'upload',
    'utilities',
  ]) {
    assert.match(entry, new RegExp(`css/${module}\\.css`));
  }
});
