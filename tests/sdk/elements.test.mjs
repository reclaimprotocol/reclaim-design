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
  assert.match(source, /define\(['"]rc-period-picker['"]/);
  assert.doesNotMatch(source, /define\(['"]rc-button['"]/);
});

test('period presets return inclusive timestamps for days and hours', () => {
  const {periodForDays, periodForHours, periodBetween, DEFAULT_PERIOD_OPTIONS} =
    elements;
  assert.deepEqual(DEFAULT_PERIOD_OPTIONS, [
    {label: 'Last 7 days', days: 7},
    {label: 'Last 30 days', days: 30},
    {label: 'Last 90 days', days: 90},
  ]);
  assert.deepEqual(periodForDays(7, new Date(2026, 0, 2)), {
    from: new Date(2025, 11, 27).toISOString(),
    through: new Date(new Date(2026, 0, 3).getTime() - 1).toISOString(),
  });
  const now = new Date('2026-10-15T12:00:00.000Z');
  assert.deepEqual(periodForHours(3, now), {
    from: '2026-10-15T09:00:00.000Z',
    through: '2026-10-15T12:00:00.000Z',
  });
  assert.deepEqual(
    periodBetween(new Date('2026-10-15T11:00:00.000Z'), now),
    periodForHours(1, now),
  );
  assert.throws(() => periodForDays(0), RangeError);
  assert.throws(() => periodForHours(0), RangeError);
});

test('period options accept hour durations and computed ranges', () => {
  const picker = new elements.ReclaimPeriodPicker();
  picker.options = [{label: 'Last 3 hours', hours: 3}];
  assert.equal(picker.options[0].hours, 3);
  assert.equal(
    Date.parse(picker.range.through) - Date.parse(picker.range.from),
    3 * 3_600_000,
  );
  picker.options = [
    {
      label: 'Previous hour',
      getRange: now =>
        elements.periodBetween(new Date(now.getTime() - 3_600_000), now),
    },
  ];
  assert.equal(
    Date.parse(picker.range.through) - Date.parse(picker.range.from),
    3_600_000,
  );
  assert.throws(() => {
    picker.options = [{label: 'Invalid', hours: 0}];
  }, TypeError);
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
