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
    '2px',
  );
  expect(
    await selectedNavigationItem.evaluate(
      element => getComputedStyle(element).borderInlineStartColor,
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
  expect(
    Math.abs(
      titleBox!.x + titleBox!.width / 2 - (dialogBox!.x + dialogBox!.width / 2),
    ),
  ).toBeLessThan(2);
  expect(
    Math.abs(
      titleBox!.y + titleBox!.height / 2 - (closeBox!.y + closeBox!.height / 2),
    ),
  ).toBeLessThan(14);
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
  ).toHaveCSS('min-height', '44px');
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
  await expect(page.getByRole('option')).toHaveCount(4);
  await scope.fill('coursera.org');
  await expect(page.getByRole('option')).toHaveCount(1);
  await page.getByRole('option', {name: /coursera-certs/}).click();
  await expect(scope).toHaveAttribute('placeholder', 'coursera-certs');

  await scope.click();
  await scope.fill('missing');
  await expect(page.getByText('No options match.')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox', {name: 'Scope'})).toBeHidden();
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
  await page
    .getByRole('listbox', {name: 'Workspace switcher'})
    .getByRole('option', {name: /Client sandbox/})
    .click();
  await expect(standaloneSwitcher).toContainText('Client sandbox');

  const organization = page.getByRole('button', {
    name: 'Organization',
    exact: true,
  });
  await organization.click();
  await page.getByRole('option', {name: /Northwind Labs/}).click();
  await expect(organization).toContainText('Northwind Labs');

  const flow = page.locator('.rc-flow-shell');
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
  } else {
    await expect(sidebar).toBeHidden();
    await expect(tabs).toBeVisible();
    await page.getByTestId('catalog-menu-trigger').click();
    await expect(page.locator('.rc-menu-sheet-layer')).toBeVisible();
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
  const expansion = page.locator('details.rc-expansion');
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
  const flow = page.locator('.rc-flow-shell');
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
