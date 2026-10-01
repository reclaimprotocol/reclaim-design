import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
  new URL('../../src/charts/index.tsx', import.meta.url),
  'utf8',
);

test('chart package exposes a broad interactive chart set', () => {
  for (const name of [
    'BarChart',
    'AreaChart',
    'LineChart',
    'FunnelChart',
    'DonutChart',
    'ScatterChart',
  ]) {
    assert.match(source, new RegExp(`export function ${name}`));
  }
});

test('every chart exposes pointer, focus, click, and keyboard activation', () => {
  assert.equal((source.match(/onPointerEnter=/g) ?? []).length, 6);
  assert.equal((source.match(/onFocus=/g) ?? []).length, 6);
  assert.equal((source.match(/onClick=/g) ?? []).length, 6);
  assert.equal((source.match(/onKeyDown=/g) ?? []).length, 6);
});
