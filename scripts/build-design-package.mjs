#!/usr/bin/env node

import {cp, mkdir, rm} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = join(root, 'src');
const outputRoot = join(root, 'dist');
const mode = process.argv[2];

if (mode === 'clean') {
  await rm(outputRoot, {recursive: true, force: true});
} else if (mode === 'copy') {
  await mkdir(outputRoot, {recursive: true});
  await Promise.all([
    cp(join(sourceRoot, 'css'), join(outputRoot, 'css'), {recursive: true}),
    cp(join(sourceRoot, 'oat'), join(outputRoot, 'oat'), {recursive: true}),
    cp(
      join(sourceRoot, 'tokens', 'assets'),
      join(outputRoot, 'tokens', 'assets'),
      {
        recursive: true,
      },
    ),
    cp(join(sourceRoot, 'tokens', 'css'), join(outputRoot, 'tokens', 'css'), {
      recursive: true,
    }),
  ]);
} else {
  throw new Error('Expected build mode: clean or copy.');
}
