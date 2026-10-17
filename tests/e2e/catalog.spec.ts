import {expect, test} from '@playwright/test';
import axe from 'axe-core';

async function openPage(page: import('@playwright/test').Page, name: string) {
  const destinations: Record<string, string> = {
    Overview: 'surface',
    Components: 'buttons-and-status',
    Patterns: 'data-display',
    Charts: 'chart-fixtures',
  };
  const section = `section-${destinations[name]}`;
  await page.locator(`a[href="#${section}"]:visible`).first().click();
  await expect(page.locator(`#${section}`)).toBeInViewport();
}

test.beforeEach(async ({page}) => {
  await page.goto('/');
  await expect(page.getByTestId('catalog-root')).toBeVisible();
});

test('period picker emits complete ranges and supports disabling custom', async ({
  page,
}) => {
  const picker = page.getByTestId('catalog-period-picker');
  await expect(
    picker.getByRole('button', {name: 'Last 7 days'}),
  ).toHaveAttribute('aria-pressed', 'true');
  const changes = await picker.evaluate(element => {
    const details: unknown[] = [];
    element.addEventListener('reclaim:periodchange', event => {
      details.push((event as CustomEvent).detail);
    });
    (window as Window & {periodChanges?: unknown[]}).periodChanges = details;
    return details.length;
  });
  expect(changes).toBe(0);
  await picker.getByRole('button', {name: 'Last 30 days'}).click();
  const preset = await page.evaluate(
    () => (window as Window & {periodChanges?: unknown[]}).periodChanges?.[0],
  );
  expect(preset).toMatchObject({
    label: 'Last 30 days',
    days: 30,
    custom: false,
  });
  expect(preset).toHaveProperty('from');
  expect(preset).toHaveProperty('through');
  await picker.getByRole('button', {name: 'Custom range'}).click();
  await picker.locator('input[type="date"]').first().fill('2026-10-01');
  await picker.locator('input[type="date"]').last().fill('2026-10-05');
  await expect(page.getByTestId('catalog-period-output')).toContainText(
    'Custom range:',
  );
  const custom = await page.evaluate(() => ({
    detail: (window as Window & {periodChanges?: unknown[]}).periodChanges?.at(
      -1,
    ),
    from: new Date(2026, 9, 1).toISOString(),
    through: new Date(2026, 9, 5, 23, 59, 59, 999).toISOString(),
  }));
  expect(custom.detail).toMatchObject({
    custom: true,
    from: custom.from,
    through: custom.through,
  });
  await page.getByLabel('Show hourly options').check();
  await picker.getByRole('button', {name: 'Last 3 hours'}).click();
  const hourly = await page.evaluate(() =>
    (window as Window & {periodChanges?: unknown[]}).periodChanges?.at(-1),
  );
  expect(hourly).toMatchObject({label: 'Last 3 hours', hours: 3, days: null});
  const hourlyRange = hourly as {from: string; through: string};
  expect(Date.parse(hourlyRange.through) - Date.parse(hourlyRange.from)).toBe(
    3 * 3_600_000,
  );
  await page.getByLabel('Option font size (px)').fill('16');
  await page.getByLabel('Button padding (px)').fill('10');
  await page.getByLabel('Border gap (px)').fill('6');
  await expect(picker.getByRole('button', {name: 'Custom range'})).toHaveCSS(
    'font-size',
    '16px',
  );
  await expect(picker.getByRole('button', {name: 'Custom range'})).toHaveCSS(
    'padding-top',
    '10px',
  );
  await expect(picker.locator('.rc-segments')).toHaveCSS('padding-top', '6px');
  await page.getByLabel('Disable custom range').check();
  await expect(picker.getByRole('button', {name: 'Custom range'})).toHaveCount(
    0,
  );
  await expect(
    picker.getByRole('button', {name: 'Last 3 hours'}),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('matches the reference surface and pointer effects', async ({page}) => {
  await expect(page.locator('[data-reclaim-guilloche] path')).toHaveCount(26);
  const glass = page.getByTestId('catalog-glass-card');
  const tile = page.getByTestId('catalog-tile');

  await glass.hover({position: {x: 24, y: 18}});
  await expect
    .poll(() =>
      glass.evaluate(element => getComputedStyle(element, '::before').opacity),
    )
    .toBe('1');
  await expect
    .poll(() => glass.evaluate(element => getComputedStyle(element).transform))
    .not.toBe('none');
  const pointer = await glass.evaluate(element => [
    getComputedStyle(element).getPropertyValue('--rc-pointer-x').trim(),
    getComputedStyle(element).getPropertyValue('--rc-pointer-y').trim(),
  ]);
  expect(pointer.every(value => value.endsWith('%'))).toBeTruthy();
  expect(
    await glass.evaluate(element =>
      getComputedStyle(element)
        .getPropertyValue('--rc-effect-glass-glow-color')
        .trim(),
    ),
  ).toMatch(/(?:0?\.34)\)$/);

  await glass.dispatchEvent('pointerdown', {
    pointerType: 'touch',
    clientX: 40,
    clientY: 30,
  });
  await expect(glass).toHaveAttribute('data-pointer-active', 'true');
  await glass.dispatchEvent('pointerup', {
    pointerType: 'touch',
    clientX: 40,
    clientY: 30,
  });
  await expect(glass).not.toHaveAttribute('data-pointer-active', 'true', {
    timeout: 1000,
  });

  await tile.hover();
  await expect
    .poll(() =>
      tile.evaluate(element => getComputedStyle(element, '::before').opacity),
    )
    .toBe('1');
  expect(
    await tile.evaluate(element => getComputedStyle(element).transform),
  ).toBe('none');

  await page.getByTestId('catalog-theme-toggle').click();
  await expect(page.locator('.rc-theme')).toHaveAttribute('data-theme', 'dark');
  const guilloche = page.locator('[data-reclaim-guilloche]');
  await expect(guilloche).toHaveCSS('position', 'fixed');
  expect(
    await guilloche.evaluate(element => getComputedStyle(element).opacity),
  ).toBe('1');
  expect(
    await guilloche
      .locator('path')
      .first()
      .evaluate(element => getComputedStyle(element).stroke),
  ).not.toBe('none');
});

test('validation and dialogs expose complete interaction states', async ({
  page,
}) => {
  await openPage(page, 'Components');
  const destructive = page.getByRole('button', {name: 'Revoke', exact: true});
  await destructive.hover();
  expect(
    await destructive.evaluate(element =>
      getComputedStyle(element)
        .getPropertyValue('--rc-effect-button-glow-color')
        .trim(),
    ),
  ).toContain('138,15,74');
  expect(
    await destructive.evaluate(element =>
      getComputedStyle(element)
        .getPropertyValue('--rc-effect-button-hover-shadow')
        .trim(),
    ),
  ).toContain('138,15,74');
  await page.getByTestId('catalog-theme-toggle').click();
  expect(
    await destructive.evaluate(element =>
      getComputedStyle(element)
        .getPropertyValue('--rc-effect-button-glow-color')
        .trim(),
    ),
  ).toContain('255,158,196');
  const busy = page.getByRole('button', {name: 'Verifying', exact: true});
  await busy.hover();
  expect(
    await busy.evaluate(
      element => getComputedStyle(element, '::before').content,
    ),
  ).toBe('none');
  expect(
    await busy.evaluate(
      element => getComputedStyle(element, '::after').animationName,
    ),
  ).toBe('rc-spin');
  const field = page.getByTestId('catalog-error-field');
  const fieldHeightBefore = (await field.locator('xpath=..').boundingBox())
    ?.height;
  await field.focus();
  await page.getByRole('heading', {name: 'Buttons and status'}).click();
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Enter a complete HTTPS URL.')).toBeVisible();
  expect((await field.locator('xpath=..').boundingBox())?.height).toBe(
    fieldHeightBefore,
  );

  const selectedNavigationItem = page.locator(
    `.catalog-navigation-specimen .rc-nav-link[aria-current='page']`,
  );
  await expect(selectedNavigationItem).toHaveCSS(
    'border-inline-start-width',
    '0px',
  );
  expect(
    await selectedNavigationItem.evaluate(
      element => getComputedStyle(element).backgroundColor,
    ),
  ).not.toBe('rgba(0, 0, 0, 0)');
  await expect(selectedNavigationItem).toHaveCSS('text-align', 'start');

  const trigger = page.getByTestId('catalog-dialog-trigger');
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  await expect(page.getByTestId('catalog-dialog')).toBeVisible();
  const dialogBox = await dialog.boundingBox();
  const titleBox = await dialog.getByRole('heading').boundingBox();
  const closeBox = await dialog
    .getByRole('button', {name: 'Close dialog'})
    .boundingBox();
  expect(titleBox!.x - dialogBox!.x).toBeLessThan(32);
  expect(Math.abs(titleBox!.y - closeBox!.y)).toBeLessThan(14);
  await expect(dialog.locator(':focus')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.mouse.click(2, 2);
  await expect(dialog).not.toBeVisible();

  await page.getByRole('button', {name: /Region ·/}).click();
  await expect(dialog).toBeVisible();
  const regionBody = dialog.locator('.rc-dialog__body');
  expect(
    await regionBody.evaluate(element =>
      Number.parseFloat(getComputedStyle(element).minHeight),
    ),
  ).toBeGreaterThanOrEqual(300);
  await expect(regionBody).toHaveCSS('overflow-wrap', 'anywhere');
  expect((await dialog.boundingBox())!.width).toBeLessThanOrEqual(680);
  await page.keyboard.press('Escape');

  const encryption = page.getByRole('switch', {name: /Result encryption/});
  await expect(encryption).toBeChecked();
  await encryption.click();
  await expect(encryption).not.toBeChecked();

  const profileTrigger = page.getByLabel('Open profile menu').first();
  const profileTriggerBounds = await profileTrigger.boundingBox();
  const profileChevronBounds = await profileTrigger
    .locator('.rc-profile-menu__chevron')
    .boundingBox();
  expect(
    Math.abs(
      profileTriggerBounds!.y +
        profileTriggerBounds!.height / 2 -
        (profileChevronBounds!.y + profileChevronBounds!.height / 2),
    ),
  ).toBeLessThan(1);
  await profileTrigger.click();
  const profilePopover = page.locator('.rc-popover__content').filter({
    has: page.getByRole('button', {name: 'Account settings'}),
  });
  await expect(profilePopover).toBeVisible();
  expect(
    await profilePopover.evaluate(element => getComputedStyle(element).width),
  ).toBe('248px');
  await expect(
    profilePopover.getByRole('button', {name: 'Account settings'}),
  ).toHaveCSS('justify-content', 'flex-start');
  const signOut = profilePopover.getByRole('button', {name: 'Sign out'});
  await expect(signOut).toHaveCSS('color', 'rgb(255, 158, 196)');
});

test('searchable dropdown filters metadata and selects a scope', async ({
  page,
}) => {
  await openPage(page, 'Components');
  const scope = page.getByRole('combobox', {name: 'Scope'});

  await scope.click();
  const listbox = page.getByRole('listbox', {name: 'Scope'});
  await expect(listbox).toBeVisible();
  await expect(listbox).toHaveCSS('position', 'fixed');
  const listboxBounds = await listbox.boundingBox();
  const viewport = page.viewportSize()!;
  expect(listboxBounds!.x).toBeGreaterThanOrEqual(0);
  expect(listboxBounds!.y).toBeGreaterThanOrEqual(0);
  expect(listboxBounds!.x + listboxBounds!.width).toBeLessThanOrEqual(
    viewport.width,
  );
  expect(listboxBounds!.y + listboxBounds!.height).toBeLessThanOrEqual(
    viewport.height,
  );
  await expect(listbox.getByRole('option')).toHaveCount(4);
  await scope.fill('coursera.org');
  await expect(listbox.getByRole('option')).toHaveCount(1);
  await listbox.getByRole('option', {name: /coursera-certs/}).click();
  await expect(scope).toHaveAttribute('placeholder', 'coursera-certs');

  await scope.click();
  await scope.fill('missing');
  await expect(page.getByText('No options match.')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox', {name: 'Scope'})).toBeHidden();
});

test('styled selections and Oat tabs expose complete behavior', async ({
  page,
}) => {
  await openPage(page, 'Components');

  const dropdown = page.getByRole('button', {name: 'Option one', exact: true});
  await expect(dropdown).toHaveClass(/rc-dropdown__trigger/);
  await expect(dropdown).toHaveCSS('border-top-style', 'solid');
  expect(
    await dropdown.evaluate(element => getComputedStyle(element).fontFamily),
  ).toContain('IBM Plex Mono');
  await dropdown.click();
  const dropdownMenu = page.getByRole('menu').filter({
    has: page.getByRole('menuitem', {name: 'Option three'}),
  });
  await expect(dropdownMenu).toBeVisible();
  await page.getByRole('heading', {name: 'Selection', exact: true}).click();
  await expect(dropdownMenu).toBeHidden();
  await dropdown.click();
  await dropdownMenu.getByRole('menuitem', {name: 'Option three'}).click();
  await expect(
    page.getByRole('button', {name: 'Option three', exact: true}),
  ).toBeVisible();

  const automatic = page.getByRole('radio', {
    name: /Publish automatically/,
  });
  await automatic.check();
  await expect(automatic).toBeChecked();

  const tabs = page.locator('ot-tabs.rc-tabs');
  const usage = tabs.getByRole('tab', {name: 'Usage'});
  await usage.click();
  await expect(usage).toHaveAttribute('aria-selected', 'true');
  await expect(
    tabs.getByRole('tabpanel').filter({hasText: 'semantic HTML'}),
  ).toBeVisible();
  await usage.press('ArrowRight');
  await expect(tabs.getByRole('tab', {name: 'Tokens'})).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

test('app bar filters share one control baseline', async ({page}) => {
  await openPage(page, 'Components');
  const specimen = page.locator('#section-app-bar-and-page-header');
  const group = specimen.locator('.rc-input-group');
  const segments = specimen.locator('.rc-segments');
  const groupBounds = await group.boundingBox();
  const segmentBounds = await segments.boundingBox();
  expect(groupBounds!.height).toBeGreaterThanOrEqual(31);
  expect(Math.abs(groupBounds!.height - segmentBounds!.height)).toBeLessThan(4);
});

test('toast, generic switcher, navigation switcher, and guided flow expose working states', async ({
  page,
}) => {
  await openPage(page, 'Components');

  await page.getByRole('button', {name: 'Warning toast'}).click();
  const toastRegion = page.getByRole('region', {name: 'Notifications'});
  await expect(toastRegion).toHaveAttribute('data-placement', 'top-right');
  const toast = toastRegion.locator('.toast');
  await expect(toast).toHaveAttribute('data-variant', 'warning');
  const toastClose = toast.getByRole('button', {name: 'Dismiss notification'});
  await expect(toastClose).toHaveCSS('position', 'absolute');
  expect(
    Number.parseFloat(
      await toastClose.evaluate(
        element => getComputedStyle(element).insetBlockStart,
      ),
    ),
  ).toBeLessThan(16);
  await toastClose.click();
  await expect(toast).toHaveCount(0);

  const standaloneSwitcher = page.getByRole('button', {
    name: 'Workspace switcher',
    exact: true,
  });
  await standaloneSwitcher.click();
  const standaloneOptions = page.getByRole('listbox', {
    name: 'Workspace switcher',
  });
  const switcherBounds = await standaloneSwitcher.boundingBox();
  const overlayBounds = await standaloneOptions
    .locator('..')
    .locator('..')
    .boundingBox();
  expect(overlayBounds!.width).toBeCloseTo(switcherBounds!.width, 0);
  await page
    .getByRole('listbox', {name: 'Workspace switcher'})
    .getByRole('option', {name: /Client sandbox/})
    .click();
  await expect(standaloneSwitcher).toContainText('Client sandbox');

  const organization = page
    .locator('#section-navigation-pane')
    .getByRole('button', {name: 'Organization', exact: true});
  await organization.click();
  await page.getByRole('option', {name: /Northwind Labs/}).click();
  await expect(organization).toContainText('Northwind Labs');

  const flow = page.locator('.rc-contributor-flow');
  await flow.getByRole('button', {name: 'Continue'}).click();
  await expect(flow.locator('.rc-field__message--error')).toHaveText(
    'Enter a workflow name before continuing.',
  );
  const workflowName = flow.getByTestId('guided-flow-name');
  await expect(workflowName).toHaveAttribute('aria-invalid', 'true');
  await workflowName.fill('Monthly checks');
  await expect(workflowName).not.toHaveAttribute('aria-invalid', 'true');
  await flow.getByRole('button', {name: 'Continue'}).click();
  await expect(flow.getByText('Configure the options')).toBeVisible();
});

test('the responsive shell never creates page-level horizontal overflow', async ({
  page,
}, testInfo) => {
  const isDesktop = testInfo.project.name === 'desktop';
  const sidebar = page.locator('.catalog-sidebar');
  const tabs = page.locator('.catalog-tabs');
  if (isDesktop) {
    await expect(sidebar).toBeVisible();
    await expect(tabs).toBeHidden();
    const navigationItem = sidebar.locator('.catalog-nav').first();
    await expect(navigationItem).toHaveCSS('justify-content', 'flex-start');
    await expect(navigationItem).toHaveCSS('text-align', 'start');
    const top = (await sidebar.boundingBox())!.y;
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    expect((await sidebar.boundingBox())!.y).toBe(top);
    await expect(sidebar.getByTestId('catalog-source-link')).toHaveAttribute(
      'href',
      'https://github.com/reclaimprotocol/reclaim-design',
    );
  } else {
    await expect(sidebar).toBeHidden();
    await expect(tabs).toBeVisible();
    await page.getByTestId('catalog-menu-trigger').click();
    await expect(page.locator('.rc-menu-sheet-layer')).toBeVisible();
    await expect(
      page.locator('.catalog-menu-sheet').getByTestId('catalog-source-link'),
    ).toHaveAttribute(
      'href',
      'https://github.com/reclaimprotocol/reclaim-design',
    );
    await page.keyboard.press('Escape');
    await expect(page.locator('.rc-menu-sheet-layer')).toHaveCount(0);
  }
  const searchableLink = page.locator(
    'a[href="#section-searchable-dropdown"]:visible',
  );
  await searchableLink.first().click();
  await expect(page).toHaveURL(/#section-searchable-dropdown$/);
  await expect(page.locator('#section-searchable-dropdown')).toBeInViewport();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBeTruthy();
});

test('expansion disclosure and build sequence use compact horizontal spacing', async ({
  page,
}, testInfo) => {
  await openPage(page, 'Patterns');
  const expansion = page.locator('#section-expansion details.rc-expansion');
  const summary = expansion.locator('summary');
  await expect(expansion).toHaveAttribute('open', '');

  const addCallback = page.getByTestId('add-callback');
  await addCallback.click();
  await expect(page.getByText('Callback configured')).toBeVisible();
  expect(
    await summary.evaluate(
      element => getComputedStyle(element).paddingInlineStart,
    ),
  ).toBe('16px');
  expect(
    await expansion.evaluate(
      element => getComputedStyle(element).backgroundColor,
    ),
  ).not.toBe('rgba(0, 0, 0, 0)');
  expect(
    await expansion.evaluate(
      element =>
        getComputedStyle(element, '::details-content').transitionProperty,
    ),
  ).toContain('block-size');
  const restingHeader = await summary.evaluate(
    element => getComputedStyle(element).backgroundColor,
  );
  await summary.hover();
  await expect
    .poll(() =>
      summary.evaluate(element => getComputedStyle(element).backgroundColor),
    )
    .not.toBe(restingHeader);
  expect(
    await summary.evaluate(element =>
      [
        getComputedStyle(element).getPropertyValue('--rc-pointer-x').trim(),
        getComputedStyle(element).getPropertyValue('--rc-pointer-y').trim(),
      ].every(value => value.endsWith('%')),
    ),
  ).toBeTruthy();
  await expect
    .poll(() =>
      summary.evaluate(element =>
        Number.parseFloat(getComputedStyle(element, '::after').opacity),
      ),
    )
    .toBeGreaterThan(0);
  await summary.dispatchEvent('pointerdown', {
    pointerType: 'touch',
    clientX: 40,
    clientY: 20,
  });
  await expect(summary).toHaveAttribute('data-pointer-active', 'true');
  await summary.dispatchEvent('pointerup', {
    pointerType: 'touch',
    clientX: 40,
    clientY: 20,
  });
  await expect(summary).not.toHaveAttribute('data-pointer-active', 'true', {
    timeout: 1000,
  });
  await summary.click();
  await expect(expansion).not.toHaveAttribute('open', '');
  await summary.click();
  await expect(expansion).toHaveAttribute('open', '');

  await openPage(page, 'Components');
  const flow = page.locator('.rc-contributor-flow');
  await expect(flow).toBeVisible();
  const expectedPadding = testInfo.project.name === 'desktop' ? '24px' : '12px';
  await expect
    .poll(() =>
      flow
        .locator('.rc-flow-shell__main')
        .evaluate(element => getComputedStyle(element).paddingInlineStart),
    )
    .toBe(expectedPadding);
  await flow.getByRole('button', {name: 'Finish, step 5 of 5'}).click();
  await expect(
    flow.getByRole('button', {name: 'Finish, step 5 of 5'}),
  ).toHaveAttribute('aria-current', 'step');
});

test('mono charts expose pointer and keyboard interaction', async ({page}) => {
  await openPage(page, 'Charts');
  const chartSection = page.locator('#section-chart-fixtures');
  const charts = chartSection.locator('.catalog-chart');
  await expect(charts).toHaveCount(6);
  await expect(
    chartSection.getByText('No activity', {exact: true}),
  ).toHaveCount(0);
  await expect(
    chartSection.getByText('Empty state', {exact: true}),
  ).toHaveCount(0);
  const bar = charts.nth(0).locator('.catalog-chart__series').first();
  await bar.focus();
  await expect(bar).toHaveAttribute('data-active', 'true');
  await expect(charts.nth(0).locator('.catalog-chart__tooltip')).toBeVisible();
  await bar.press('Enter');
  await page.evaluate(() =>
    (document.activeElement as HTMLElement | null)?.blur(),
  );
  await expect(bar).toHaveAttribute('data-active', 'true');

  const point = charts.nth(1).locator('.catalog-chart__point').nth(2);
  await point.hover();
  await expect(point).toHaveAttribute('data-active', 'true');
  await expect(charts.nth(1).locator('.catalog-chart__tooltip')).toBeVisible();

  const funnelRow = charts.nth(3).locator('.catalog-chart__funnel-row').last();
  await funnelRow.focus();
  await expect(funnelRow).toHaveAttribute('data-active', 'true');

  const donutSegment = charts
    .nth(4)
    .locator('.catalog-chart__donut-segment')
    .nth(1);
  await donutSegment.press('Space');
  await expect(donutSegment).toHaveAttribute('data-active', 'true');

  const scatterPoint = charts
    .nth(5)
    .locator('.catalog-chart__scatter-point')
    .last();
  await scatterPoint.hover();
  await expect(scatterPoint).toHaveAttribute('data-active', 'true');
});

test('dialog footers submit method forms and forms linked by attribute', async ({
  page,
}) => {
  await page
    .locator('a[href="#section-dialog-forms-and-toasts"]:visible')
    .first()
    .click();
  const output = page.getByTestId('catalog-dialog-output');

  await page.getByRole('button', {name: 'Method dialog form'}).click();
  const method = page.locator('#catalog-method-dialog');
  await expect(method).toBeVisible();
  const footer = method.locator('.rc-dialog__footer');
  await expect(footer).toHaveCSS('justify-content', 'flex-end');
  await expect(footer).toHaveCSS('padding-top', '14px');
  await expect(footer).toHaveCSS('padding-right', '20px');
  await expect(footer).toHaveCSS('border-top-width', '1px');
  await expect(footer.getByRole('button', {name: 'Save'})).toHaveCSS(
    'height',
    '32px',
  );
  const bodyBounds = await method.locator('.rc-dialog__body').boundingBox();
  const dialogBounds = await method.boundingBox();
  expect(bodyBounds!.width).toBeCloseTo(dialogBounds!.width - 2, 0);
  await footer.getByRole('button', {name: 'Save'}).click();
  await expect(method).toBeHidden();
  await expect(output).toHaveText('Saved by method dialog');

  await page.getByRole('button', {name: 'Footer linked form'}).click();
  const linked = page.locator('#catalog-linked-dialog');
  await linked.getByRole('button', {name: 'Save'}).click();
  await expect(linked).toBeHidden();
  await expect(output).toHaveText('Saved by linked form');
});

test('package toast follows the theme from outside the theme root', async ({
  page,
}) => {
  await page.getByTestId('catalog-theme-toggle').click();
  await page
    .locator('a[href="#section-dialog-forms-and-toasts"]:visible')
    .first()
    .click();
  await page.getByRole('button', {name: 'Show package toast'}).click();
  const toast = page.locator('body > .toast-container .toast');
  await expect(toast).toHaveAttribute('data-variant', 'danger');
  const panel = await page.evaluate(() => {
    const toastNode = document.querySelector('body > .toast-container .toast')!;
    const read = (node: Element) =>
      getComputedStyle(node)
        .getPropertyValue('--rc-color-surface-panel')
        .trim();
    return {
      toast: read(toastNode),
      root: read(document.querySelector('[data-theme-root]')!),
      scheme: getComputedStyle(toastNode).colorScheme,
    };
  });
  expect(panel.toast).toBe(panel.root);
  expect(panel.scheme).toBe('dark');
  await toast.getByRole('button', {name: 'Dismiss notification'}).click();
  await expect(toast).toHaveCount(0);
});

test('site, card, chart, and combobox patterns match the package contract', async ({
  page,
}) => {
  await page.locator('a[href="#section-site-pages"]:visible').first().click();
  const subject = page.locator('.rc-flow-shell__subject');
  await expect(subject).toHaveCSS('text-overflow', 'ellipsis');
  await expect(subject).toHaveCSS('margin-left', '0px');
  expect(
    await subject.evaluate(node => node.scrollWidth > node.clientWidth),
  ).toBe(true);
  await expect(page.locator('.catalog-site-specimen .rc-app-bar')).toHaveCSS(
    'position',
    'sticky',
  );
  await expect(page.locator('.catalog-notice h1')).toBeVisible();

  const plan = page.locator('.rc-plan[data-featured]');
  await expect(plan).not.toHaveAttribute('data-current');
  await expect(plan.locator('.rc-plan__badge')).toHaveCSS(
    'align-self',
    'start',
  );

  const person = page.locator('a.rc-person').first();
  await expect(person).toHaveCSS('text-decoration-line', 'none');
  await expect(
    page.locator('.rc-event-timeline li[data-tone="muted"]'),
  ).toHaveCount(1);

  const readiness = page
    .getByTestId('catalog-readiness')
    .locator('.rc-status')
    .first();
  await expect(readiness).toHaveCSS('border-top-width', '1px');
  await expect(readiness).toHaveCSS(
    'border-top-left-radius',
    /^\d{3,}|9999|\d+px$/,
  );
  await expect(
    page.locator('.rc-card__header[data-variant="plain"]'),
  ).toHaveCSS('border-bottom-width', '0px');
  const iconOnly = page.getByTestId('catalog-icon-only');
  await expect(iconOnly).toHaveCSS('border-bottom-width', '1px');
  await expect(iconOnly).toHaveCSS('padding-left', '0px');
  const iconBox = await iconOnly.boundingBox();
  expect(iconBox!.width).toBeCloseTo(iconBox!.height, 0);
  const chipBox = await page.locator('.rc-chip').first().boundingBox();
  expect(chipBox!.height).toBeGreaterThanOrEqual(32);
  const headerBox = await page
    .locator('.rc-card__header:not([data-variant="plain"])')
    .first()
    .boundingBox();
  expect(headerBox!.height).toBeGreaterThanOrEqual(69);
  await expect(page.locator('.rc-table-scroll[data-bordered]')).toHaveCSS(
    'border-top-width',
    '1px',
  );

  const combobox = page.getByTestId('catalog-vanilla-combobox');
  const input = combobox.getByRole('combobox');
  await input.focus();
  const list = combobox.getByRole('listbox');
  await expect(list).toBeVisible();
  const inputBox = await input.boundingBox();
  const listBox = await list.boundingBox();
  expect(listBox!.y).toBeGreaterThan(inputBox!.y + inputBox!.height - 1);
  expect(listBox!.y).toBeLessThan(inputBox!.y + inputBox!.height + 12);
  await list.getByRole('option', {name: 'github-profile'}).click();
  await expect(input).toHaveValue('github-profile');
  await expect(list).toBeHidden();

  await page
    .locator('a[href="#section-server-rendered-charts"]:visible')
    .first()
    .click();
  const bars = page.locator('.rc-bar-chart > li');
  await expect(bars).toHaveCount(6);
  const first = bars.first();
  await first.focus();
  await expect(first).toHaveCSS('background-color', /rgba?\(/);
  const heights = await first
    .locator('span:not(.rc-visually-hidden)')
    .evaluateAll(nodes =>
      nodes.map(node => node.getBoundingClientRect().height),
    );
  expect(heights.every(height => height >= 2)).toBe(true);
  const split = page.locator('.rc-bar-list__bar').first();
  expect((await split.boundingBox())!.width).toBeGreaterThan(40);
  await page.locator('.rc-area-chart__points > li').nth(2).focus();
  await expect(
    page.locator('.rc-area-chart__points > li').nth(2),
  ).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('has no serious or critical automated accessibility violations', async ({
  page,
}) => {
  await page.addScriptTag({content: axe.source});
  const result = await page.evaluate(async () => {
    const axeApi = (
      window as typeof window & {
        axe: {
          run: (
            context: Document,
            options: object,
          ) => Promise<{
            violations: Array<{
              id: string;
              impact: string | null;
              nodes: unknown[];
            }>;
          }>;
        };
      }
    ).axe;
    return axeApi.run(document, {
      runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa']},
    });
  });
  const severe = result.violations.filter(
    violation =>
      violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(
    severe,
    severe
      .map(violation => `${violation.id}: ${violation.nodes.length}`)
      .join('\n'),
  ).toEqual([]);
});
