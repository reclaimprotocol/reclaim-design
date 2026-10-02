import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const imageEditor = await import('../../dist/image-editor/index.js');
const source = await readFile(
  new URL('../../src/image-editor/index.tsx', import.meta.url),
  'utf8',
);

test('image editor exposes generic dialog and field primitives', () => {
  assert.equal(typeof imageEditor.ImageEditorDialog, 'function');
  assert.equal(typeof imageEditor.EditableImageField, 'function');
  assert.match(source, /export function ImageEditorDialog/);
  assert.match(source, /export function EditableImageField/);
  assert.match(source, /export type ImageEditorDialogProps/);
  assert.match(source, /export type EditableImageFieldProps/);
});

test('image editor labels controls and reports failures', () => {
  assert.match(source, /<RangeField\s+label=\{labels\.zoom\}/);
  assert.match(source, /<RangeField\s+label=\{labels\.padding\}/);
  assert.match(source, /<ColorField\s+label=\{labels\.background\}/);
  assert.match(source, /<UploadResult/);
  assert.match(source, /role="alert"/);
  assert.match(source, /URL\.revokeObjectURL/);
});
