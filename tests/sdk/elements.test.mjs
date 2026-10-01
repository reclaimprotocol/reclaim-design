import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('the package only registers the complex combobox composite', async () => {
  const source = await readFile(
    new URL('../../src/elements/index.ts', import.meta.url),
    'utf8',
  );
  assert.match(source, /define\(['"]rc-combobox['"]/);
  assert.doesNotMatch(source, /define\(['"]rc-button['"]/);
});
