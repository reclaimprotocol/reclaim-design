import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const cssFiles = [
  'src/css/base.css',
  'src/css/components.css',
  'src/css/effects.css',
  'src/css/utilities.css',
];

test('every library-owned CSS variable reference is generated', async () => {
  const generated = await readFile('src/tokens/css/tokens.css', 'utf8');
  const definitions = new Set(
    [...generated.matchAll(/(--rc-[a-z0-9-]+)\s*:/g)].map(match => match[1]),
  );
  const css = (
    await Promise.all(cssFiles.map(file => readFile(file, 'utf8')))
  ).join('\n');
  const references = new Set(
    [...css.matchAll(/var\((--rc-[a-z0-9-]+)/g)].map(match => match[1]),
  );
  const consumerOverrides = new Set([
    '--rc-anchor',
    '--rc-chart-height',
    '--rc-flow-space',
    '--rc-grid-min',
    '--rc-metadata-key-width',
    '--rc-pointer-x',
    '--rc-pointer-y',
    '--rc-progress-value',
    '--rc-table-columns',
  ]);
  const missing = [...references].filter(
    name => !definitions.has(name) && !consumerOverrides.has(name),
  );
  assert.deepEqual(
    missing,
    [],
    `Missing generated tokens: ${missing.join(', ')}`,
  );
});

test('theme output preserves the distinct dark spec color', async () => {
  const generated = await readFile('src/tokens/css/tokens.css', 'utf8');
  const dark = generated.slice(generated.indexOf('[data-theme="dark"]'));
  assert.match(dark, /--rc-color-border-spec: #B0B0FF/);
  assert.match(dark, /--rc-color-action-primary: #6666FF/);
  assert.match(dark, /--rc-color-surface-guilloche: rgba\(255,255,255,0.016\)/);
});
