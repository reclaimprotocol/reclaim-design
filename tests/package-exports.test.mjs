import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const manifest = JSON.parse(await readFile('package.json', 'utf8'));

test('one public package exposes isolated web entry points', () => {
  assert.equal(manifest.name, '@reclaimprotocol/design');
  for (const subpath of [
    '.',
    './react',
    './charts',
    './behaviors',
    './elements',
    './icons',
    './tokens',
    './tokens.css',
    './css',
  ]) {
    assert.ok(manifest.exports[subpath], `Missing export ${subpath}`);
  }
  for (const entry of Object.values(manifest.exports)) {
    const paths = typeof entry === 'string' ? [entry] : Object.values(entry);
    assert.ok(
      paths.every(path => path.startsWith('./dist/')),
      `Source export found: ${paths.join(', ')}`,
    );
  }
  assert.deepEqual(manifest.files, [
    'README.md',
    'DESIGN.md',
    'LICENSE',
    'THIRD_PARTY_NOTICES.md',
    'dist',
    'vendor/oat/LICENSE.oat',
    'vendor/oat/VENDOR.md',
  ]);
});

test('framework runtimes stay optional and CSS is explicitly side-effectful', () => {
  assert.equal(manifest.peerDependenciesMeta.react.optional, true);
  assert.equal(manifest.peerDependenciesMeta['react-dom'].optional, true);
  assert.ok(manifest.sideEffects.includes('./dist/**/*.css'));
  assert.doesNotMatch(manifest.exports['.'].import, /react|charts/);
});

test('the repository root is directly installable from Git', () => {
  assert.equal(manifest.name, '@reclaimprotocol/design');
  assert.deepEqual(manifest.workspaces, ['apps/*']);
  assert.match(manifest.scripts.prepare, /build:sdk/);
});
