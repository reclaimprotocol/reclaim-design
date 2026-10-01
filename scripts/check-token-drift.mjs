#!/usr/bin/env node
import {fileURLToPath} from 'node:url';
import {dirname, join, relative, resolve} from 'node:path';
import {readFile} from 'node:fs/promises';
import {compileTokens} from './build-tokens.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'src', 'tokens');
const artifacts = await compileTokens(root);
const drifted = [];

for (const [file, expected] of Object.entries(artifacts)) {
  const target = join(output, file);
  let actual = null;
  try {
    actual = await readFile(target, 'utf8');
  } catch {
    /* reported below */
  }
  if (actual !== expected) {
    drifted.push(relative(root, target));
  }
}

if (drifted.length) {
  console.error(
    `Token artifacts are stale:\n${drifted.map(file => `- ${file}`).join('\n')}\nRun: node scripts/build-tokens.mjs`,
  );
  process.exitCode = 1;
} else {
  console.log('Token artifacts are current.');
}
