import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
  new URL('../../src/react/index.tsx', import.meta.url),
  'utf8',
);

test('react package exposes console and contributor-flow primitives', () => {
  for (const name of [
    'AppShell',
    'Breadcrumbs',
    'Sidebar',
    'NavigationPane',
    'AppBar',
    'PageHeader',
    'FilterToolbar',
    'Switch',
    'MetadataList',
    'BottomTabs',
    'MenuSheet',
    'Popover',
    'Dropdown',
    'Dialog',
    'Tooltip',
    'Alert',
    'Avatar',
    'Meter',
    'Tabs',
    'TagInput',
    'UploadField',
    'UploadResult',
    'RangeField',
    'ColorField',
    'PickerField',
    'SelectionDialog',
    'ToastRegion',
    'SwitcherDropdown',
    'LinearProgress',
    'CircularProgress',
    'Combobox',
    'SearchableDropdown',
    'Chip',
    'ChoiceRow',
    'StatusIndicator',
    'ListPanel',
    'SectionCard',
    'NumberedStep',
    'DataGrid',
    'Pagination',
    'CodeBlock',
    'useCopy',
    'Progress',
    'Skeleton',
    'ExpansionTile',
    'EmptyState',
    'BlockingWarning',
    'InlineFeedback',
    'PeriodPicker',
    'EventTimeline',
    'ProgressTicks',
    'FlowShell',
    'ContributorFlowShell',
    'HoverNavigation',
    'ProfileMenu',
  ]) {
    assert.match(source, new RegExp(`export (function|const) ${name}`));
  }
});

test('interactive primitives retain native keyboard and dialog semantics', () => {
  assert.match(source, /<dialog/);
  assert.match(source, /aria-labelledby/);
  assert.match(source, /type=\{type\}/);
  assert.match(source, /role="table"/);
  assert.match(source, /role="progressbar"/);
  assert.match(source, /aria-current=\{index === current \? ['"]step['"]/);
  assert.match(source, /type="range"/);
  assert.match(source, /type="color"/);
  assert.match(source, /className="rc-selection-dialog__options"/);
});
