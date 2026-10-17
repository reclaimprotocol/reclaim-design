import assert from 'node:assert/strict';
import {access, mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {compileTokens, writeTokenArtifacts} from './build-tokens.mjs';

const artifacts = await compileTokens();
const css = artifacts['css/tokens.css'];
assert.match(css, /--rc-color-surface-canvas: #F7F7FB;/);
assert.match(
  css,
  /\[data-theme="dark"\][\s\S]*--rc-color-surface-canvas: #040A20;/,
);
assert.match(css, /:root:has\(\[data-theme-root\]\[data-theme="dark"\]\) \{/);
assert.match(
  css,
  /--rc-component-button-primary-background: linear-gradient\(#0000EE 0%, #6666F5 100%\);/,
);
assert.match(css, /--rc-guilloche-count: 26;/);
assert.match(css, /--rc-color-surface-guilloche: rgba\(120,120,150,0.026\);/);
assert.match(css, /@font-face/);
assert.match(
  artifacts['types/tokens.ts'],
  /export type ThemeName = keyof typeof themes;/,
);
assert.deepEqual(Object.keys(artifacts).sort(), [
  'css/tokens.css',
  'types/tokens.ts',
]);

const target = await mkdtemp(join(tmpdir(), 'reclaim-tokens-'));
try {
  await writeTokenArtifacts(undefined, target);
  assert.equal(await readFile(join(target, 'css', 'tokens.css'), 'utf8'), css);
  await access(join(target, 'assets', 'noise.svg'));
  await access(join(target, 'assets', 'GnuMICR.otf'));
} finally {
  await rm(target, {recursive: true, force: true});
}

console.log('Token compiler tests passed.');
