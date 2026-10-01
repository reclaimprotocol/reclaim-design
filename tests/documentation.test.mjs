import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('the agent integration contract covers public package boundaries', async () => {
  const design = await readFile('DESIGN.md', 'utf8');
  for (const requirement of [
    '@reclaimprotocol/design/react',
    '@reclaimprotocol/design/behaviors',
    '@reclaimprotocol/design/tokens.css',
    'Apply accessibility rules',
    'Verify an integration',
    'Agent task template',
  ]) {
    assert.match(design, new RegExp(requirement.replaceAll('/', '\\/')));
  }
});
