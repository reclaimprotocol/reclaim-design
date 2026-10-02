import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

globalThis.HTMLElement ??= class {};

const elements = await import('../../dist/elements/index.js');

test('the package registers only stateful custom-element composites', async () => {
  const source = await readFile(
    new URL('../../src/elements/index.ts', import.meta.url),
    'utf8',
  );
  assert.match(source, /define\(['"]rc-combobox['"]/);
  assert.match(source, /define\(['"]rc-local-asset-field['"]/);
  assert.match(source, /define\(['"]rc-image-editor['"]/);
  assert.doesNotMatch(source, /define\(['"]rc-button['"]/);
});

test('accept validation supports MIME families and extensions', () => {
  const png = {name: 'Mark.PNG', size: 120, type: 'image/png'};
  assert.equal(elements.acceptsFile(png, 'image/*'), true);
  assert.equal(elements.acceptsFile(png, '.png,.jpg'), true);
  assert.equal(elements.acceptsFile(png, 'video/mp4'), false);
});

test('local validation enforces size and image dimensions', async () => {
  const file = {name: 'mark.png', size: 120, type: 'image/png'};
  await elements.validateLocalAsset(file, {
    accept: 'image/png',
    maxSize: 200,
    minImageHeight: 500,
    minImageWidth: 500,
    readDimensions: async () => ({height: 800, width: 800}),
  });
  await assert.rejects(
    elements.validateLocalAsset(file, {
      minImageWidth: 900,
      readDimensions: async () => ({height: 800, width: 800}),
    }),
    /at least 900px wide/,
  );
  await assert.rejects(
    elements.validateLocalAsset(file, {maxSize: 100}),
    /smaller than 1 KB/,
  );
});

test('local asset field defines validation, preparation, and cleanup', async () => {
  const source = await readFile(
    new URL('../../src/elements/local-asset-field.ts', import.meta.url),
    'utf8',
  );
  assert.match(source, /export function acceptsFile/);
  assert.match(source, /export async function validateLocalAsset/);
  assert.match(source, /prepare: LocalAssetPrepare/);
  assert.match(source, /AbortController/);
  assert.match(source, /URL\.revokeObjectURL/);
  assert.match(source, /reclaim:assetstatechange/);
  assert.match(source, /reclaim:assetchange/);
});

test('native image editor uses dialog, canvas, and standard events', async () => {
  const source = await readFile(
    new URL('../../src/elements/image-editor.ts', import.meta.url),
    'utf8',
  );
  assert.match(source, /createElement\('dialog'\)/);
  assert.match(source, /createElement\('canvas'\)/);
  assert.match(source, /showModal\(\)/);
  assert.match(source, /reclaim:imageapply/);
  assert.doesNotMatch(source, /from ['"]react['"]/);
});
