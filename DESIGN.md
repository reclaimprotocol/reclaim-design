# Reclaim Design integration guide

This document defines how coding agents integrate `@reclaimprotocol/design` into
web applications. It describes the package's public entry points, visual
contract, interaction rules, and verification requirements.

## Integration objective

Build interfaces from the package's tokens, semantic CSS classes, behaviors,
icons, Oat elements, and Reclaim custom elements. Keep application data,
routing, product composition, and domain logic in the consuming application.

## Choose public entry points

Use only exports declared in the root `package.json`.

| Consumer need                         | Import                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------- |
| Complete tokens and component styling | `@reclaimprotocol/design/tokens.css` and `@reclaimprotocol/design/css` |
| Semantic HTML or HTMX behavior        | `@reclaimprotocol/design/behaviors`                                    |
| DOM-free behavior helpers             | `@reclaimprotocol/design/behaviors/core`                               |
| Custom elements                       | `@reclaimprotocol/design/elements`                                     |
| SVG strings                           | `@reclaimprotocol/design/icons`                                        |
| Approved Reclaim identity assets      | `@reclaimprotocol/design/brand`                                        |
| Typed token values                    | `@reclaimprotocol/design/tokens`                                       |
| Optional Oat browser runtime          | `@reclaimprotocol/design/oat`                                          |

Never import private files from `src` or `dist`. The export map is the stable
package boundary and provides JavaScript, declarations, styles, and assets.

## Install and load the package

Install the design package:

```sh
npm install @reclaimprotocol/design
```

Load tokens before component CSS in the application entry point:

```ts
import '@reclaimprotocol/design/tokens.css';
import '@reclaimprotocol/design/css';
```

Place application overrides after these imports. Prefer semantic custom
properties such as `--rc-color-text-primary` and component properties such as
`--rc-component-card-padding`.

## Integrate semantic HTML

Use native HTML elements and public `rc-` classes:

```html
<section class="rc-card">
  <label class="rc-field">
    <span class="rc-field__label">Callback URL</span>
    <input class="rc-input" name="callback" type="url" />
    <span class="rc-field__message" aria-live="polite">&nbsp;</span>
  </label>
  <button class="rc-button" data-variant="primary" type="submit">
    Save callback
  </button>
</section>
```

Initialize behaviors once at the browser application boundary:

```ts
import {initReclaimBehaviors} from '@reclaimprotocol/design/behaviors';

const design = initReclaimBehaviors(document);

export function disposeDesignBehaviors() {
  design.destroy();
}
```

The delegated behavior controller supports server-rendered fragments and HTMX
swaps without component remounting.

The theme behavior toggles `data-theme` on `[data-theme-root]` and saves the
choice. Pass `{theme: {followSystem: true}}` to follow the operating system
theme until a person picks one.

Dark tokens also apply at the document level when `[data-theme-root]` is dark
(`:root:has([data-theme-root][data-theme="dark"])`). Elements outside the theme
root, such as toasts and other body-level overlays, follow the theme without
extra markup.

## Compose application components

Framework applications render the same semantic HTML shown in the catalog. Keep
values controlled through native properties and events. Keep routing, requests,
validation policy, persistence, and feature-specific composition in the
application.

Use native inputs for fields, ranges, colors, and radio cards. Use Oat's
`ot-tabs` element for tabs and load `@reclaimprotocol/design/oat` at the browser
boundary. Use delegated Reclaim behaviors for document-level interactions.

Register `@reclaimprotocol/design/elements` when the application uses
`rc-local-asset-field`, `rc-image-editor`, or another stateful composite. Set
complex callbacks such as local asset preparation through JavaScript properties,
and listen to their documented DOM events.

- Set `rc-local-asset-field.prepare` to an async function when a file needs
  local preprocessing. Listen for `reclaim:assetchange`,
  `reclaim:assetstatechange`, and `reclaim:assetclear`.
- Set `rc-image-editor.source`, call `open()`, and listen for
  `reclaim:imageapply`. Read the PNG data URL from `event.detail.dataUrl`.
- Use `rc-period-picker` for reporting ranges. Its presets default to Last 7,
  Last 30, and Last 90 days; each includes today. Set `options` to an array of
  `{label, days}`, `{label, hours}`, or `{label, getRange(now)}` to change
  labels and ranges. The callback returns `{from, through}` as ISO dates or
  timestamps; use `periodBetween(from, through = new Date())` when the end
  should default to now. Set `disableCustom` or add `disable-custom` to hide the
  custom option. Listen for `reclaim:periodchange`: `event.detail.from` and
  `event.detail.through` are inclusive ISO timestamps. The event also carries
  `label`, `days`, `hours`, and `custom`; unused durations are `null`. Read
  `element.range` for the initial pair before any change event. Set
  `--rc-component-period-option-font-size`,
  `--rc-component-period-option-padding-block`,
  `--rc-component-period-option-padding-inline`, and
  `--rc-component-period-border-gap` to adjust all option buttons, including
  Custom range.

## Build console screens

Build product screens from these classes. Use `data-*` attributes for variants
and state. Every component works without JavaScript.

### Shell and page

| Pattern     | Markup                                                                                                                                                                                                                                                                                 |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell       | `.rc-app-shell` holds `aside.rc-sidebar.rc-navigation-pane`, `main.rc-app-shell__main`, and optional `nav.rc-bottom-tabs`. The main element holds `header.rc-app-bar` and `.rc-app-shell__content`, which scrolls. The shell is `100dvb` tall.                                         |
| Mobile menu | Add `popover` and an `id` to the sidebar. Give the last tab a `popovertarget` for that id. At 900px and below the sidebar becomes a bottom sheet with a scrim, Escape, and outside-press dismissal. Without `popover`, the sidebar hides at 900px.                                     |
| Brand       | `.rc-navigation-pane__brand` holds an `img` mark and `<span class="rc-wordmark" role="img" aria-label="Reclaim">`. The wordmark follows `color` in both themes.                                                                                                                        |
| Navigation  | `.rc-navigation-group` holds `h2` and links. `.rc-nav-link` holds an optional `svg`, a `span`, and an optional `small` count. Set `aria-current="page"` on the active link. A row with a `small` count is 36px tall; others are 34px. The active state has no side bar.                |
| Footer      | `.rc-navigation-pane__footer` holds buttons. Use `.rc-button[data-size="lg"][data-width="full"]`; put a `.rc-button__trailing` icon last.                                                                                                                                              |
| App bar     | `.rc-app-bar` holds `.rc-app-bar__breadcrumbs > ol.rc-breadcrumbs` and `.rc-app-bar__actions`. The current crumb is accent colored.                                                                                                                                                    |
| Page        | `section.rc-page`, optionally `data-width="xs"` (860px), `sm` (900), `md` (940), `lg` (1000), or `xl` (1080). Padding is 28/32/48 and 20/16 at 900px and below.                                                                                                                        |
| Page header | `.rc-page-header` holds a first `div` with `.rc-eyebrow`, `h1`, optional `.rc-page-header__meta` (put `.rc-kind-tag` and text here), and `p`; then optional `.rc-page-header__actions`. Use `span.rc-eyebrow` or `p.rc-eyebrow`; the lede rule skips `.rc-eyebrow`.                    |
| Breadcrumbs | `ol.rc-breadcrumbs`; links are accent colored. As the first child of `.rc-page` it gets bottom spacing.                                                                                                                                                                                |
| Filter bar  | `.rc-filter-toolbar` holds one or more `.rc-filter-toolbar__controls` rows. A row holds `.rc-label`, controls, `.rc-filter-toolbar__results`, and `.rc-filter-toolbar__actions`. Wrap a label and its control in `.rc-filter-toolbar__field` to keep them together when the row wraps. |
| Layout      | `.rc-grid` (set `--rc-grid-min`, `data-align="start"`), `.rc-kpi-grid`, `.rc-plan-grid`, `.rc-split` (main plus 300px aside), `.rc-stack[data-gap="sm"]`. A stack is one column that never grows past its container, so a wide table scrolls inside its own wrapper.                   |

### Controls

| Pattern     | Markup                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button      | `.rc-button`; `data-variant="primary\|destructive\|inline"`; `data-size="sm\|md\|lg\|xl"` (28, 32, 34, 40px; default 30px); `data-width="full"`. A danger text action is `data-variant="inline" data-tone="danger"`. Add `data-icon-only` and an `aria-label` for a square icon button; it keeps a border in every variant, so an inline icon button has no underline. A theme toggle is an icon button with `data-theme-toggle` holding `span[data-theme-icon="moon"]` and `span[data-theme-icon="sun"]`; it shows the moon in light and the sun in dark.                                                                                                                                                                                                                                                              |
| Pill        | `.rc-pill[data-tone="verified\|pending\|failed\|sandbox"]`; add `data-dot` for a dot. No tone is neutral. `.rc-kind-tag` is an outlined caps tag. `.rc-count` is a count pill. `.rc-status` is a dot with text; add `data-variant="chip"` for a bordered pill chip, with `.rc-status--verified\|pending\|failed\|neutral\|optional` setting the dot (optional is dashed).                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Chip        | `.rc-chip`; active is `aria-pressed="true"`, `aria-selected="true"`, or `data-active="true"`. `.rc-chip--add` is dashed. Chips are 32px tall.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Segments    | `fieldset.rc-segments` with `button[data-segment][aria-pressed]`, or with `label` > `input.rc-visually-hidden[type=radio]` when the choice must submit with a form. Options are joined. `data-width="full"` fills the row; without it, the control sizes to its content and aligns to the start inside a grid or stack.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Field       | `.rc-field` with `.rc-field__label`, `.rc-input`, `.rc-select`, or `.rc-textarea`, `.rc-field__hint`, `.rc-field__message`. Inputs are mono. `.rc-select` keeps the native chevron and reserves room for it. Add `data-reserve` to reserve message space.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Field grid  | `.rc-field-grid` holds `label.rc-field__label` then a `div` with the control and `.rc-field__hint`. It becomes one column at 560px.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Search      | `label.rc-search[data-size="lg"?]` holds an `svg`, an `input`, and `.rc-search__count`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Input group | `.rc-input-group[data-tone="accent"?]` holds `.rc-input-group__caption`, `input`, `.rc-input-group__sep`, and an `svg`. Inline combobox: `.rc-combobox[data-variant="inline"]` with `.rc-combobox__caption`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Combobox    | `.rc-combobox[data-combobox]` holds `.rc-combobox__control` (`input[role="combobox"]` and `.rc-combobox__trigger`) and a `hidden` `.rc-combobox__listbox[role="listbox"]` with `[role="option"]` buttons. The listbox is anchored under the control. The behavior opens it on focus or trigger press, filters on input, and closes it on choice, Escape, or outside press. For a large set, add `data-combobox-remote` and a hidden `input[data-combobox-value]`: the server filters and pages the options (for example with htmx), the text input searches and shows the chosen label as its placeholder, arrow keys move the highlight, Enter chooses, and only the hidden input fires `change`. A `button.rc-combobox__more` at the end of the listbox loads the next page. Options can be `a[role="option"]` links. |
| Menu rows   | Dropdown, switcher, profile, combobox, and searchable rows share one style. Put a trailing `small` for meta. Use `.rc-dropdown__label`, `.rc-dropdown__help`, and `hr` for structure.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Switcher    | Current row has `aria-selected="true"`; others show an outlined mark. `.rc-switcher-dropdown__action` is the create row. The trigger is 42px tall, the brand row is 60px, and menu rows are 36px.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Choice row  | `label.rc-choice-row` holds `input`, `.rc-choice-row__box` or `.rc-choice-row__code`, `.rc-choice-row__content`, and `.rc-choice-row__trailing`. `data-variant="add"` is dashed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Dialog      | `dialog.rc-dialog[data-size="sm\|md"]` (420, 520; default 560px) holds `.rc-dialog__header`, `.rc-dialog__body`, `.rc-dialog__footer`. Headers are start aligned; footers are right aligned. Put actions in `.rc-dialog__footer` (padding 14/20, top border, 32px buttons). A `<form method="dialog">` can wrap the header, body, and footer. For a form inside the body, give the footer submit `form="form-id"`.                                                                                                                                                                                                                                                                                                                                                                                                      |

### Data display

| Pattern     | Markup                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Card        | `.rc-card`; `data-density="compact"`; `data-glass`; `data-spec`; `data-tone="danger"`; `data-layout="row"` (text left, action right). Anatomy: `.rc-card__header` (`h3`, `.rc-count`, `.rc-card__meta`), `.rc-card__body`, `.rc-card__footer`. Add `data-variant="plain"` to `.rc-card__header` to drop the divider. A header is at least 69px tall (a 40px title row between 14px padding and the divider), with or without a control. `data-tone="danger"` colors the card title (`h2`, `h3`, or `.rc-plan__name`). |
| Table       | `.rc-table-scroll > table.rc-table`. Mark the active row `aria-selected="true"`; right-align cells with `data-align="end"`. The `div` grid form (`.rc-table__header`, `.rc-table__row`) takes the same states. Add `data-bordered` to `.rc-table-scroll` for a bordered panel without a card header.                                                                                                                                                                                                                  |
| List row    | `.rc-list-row` holds `.rc-list-row__main` (`strong`, `small`, `small[data-mono]`) and `.rc-list-row__trail`.                                                                                                                                                                                                                                                                                                                                                                                                          |
| KPI         | `.rc-kpi` holds `.rc-kpi__label`, `.rc-kpi__value`, `.rc-kpi__delta`; place in `.rc-kpi-grid`, which adds 12px below itself so the next row sits 24px away.                                                                                                                                                                                                                                                                                                                                                           |
| Key-value   | `dl.rc-metadata-list > div > dt + dd`. Set `--rc-metadata-key-width` for the key column.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Code        | `.rc-code-block` holds an optional `.rc-label`, `pre.rc-code` (wraps), and a copy button below.                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Progress    | `.rc-progress-wrap` holds a label `span` (with a trailing value `span`), `.rc-progress[data-tone="warning\|danger"]`, and `small`. Ring: `.rc-circular-progress` with a `span` holding the figure and `small`.                                                                                                                                                                                                                                                                                                        |
| Pool        | `.rc-pool` holds `.rc-pool__header`, `.rc-pool__figure`, a progress bar, and `.rc-pool__note`.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Plan        | `.rc-plan[data-current]` holds `.rc-plan__badge`, `.rc-plan__name`, `.rc-plan__price` (`strong`, `small`), `.rc-plan__tagline`, `.rc-plan__features` (`li` with an `svg`), `.rc-plan__cta`. `data-current` marks the plan in use and `data-featured` marks the promoted plan; both use the accent border. `.rc-plan__badge` aligns to the start.                                                                                                                                                                      |
| Chart frame | `.rc-chart-frame` holds `.rc-chart-frame__header` and `.rc-chart-frame__body[data-kind="area\|funnel"]`. The header title is a 40px row, followed by an 18px gap. The app draws the chart.                                                                                                                                                                                                                                                                                                                            |
| Callouts    | `.rc-blocking-warning` (`__icon`, `__body`, `__action`); `.rc-hint` (`svg`, `strong`, `p`); `.rc-empty-state` (`p` and a link); `.rc-card[data-spec]`.                                                                                                                                                                                                                                                                                                                                                                |
| Expansion   | `details.rc-expansion > summary` with `strong`, `small`, and `.rc-expansion__trail`; then `.rc-expansion__body`. The title stays next to the chevron when there is no trail.                                                                                                                                                                                                                                                                                                                                          |
| Timeline    | `ol.rc-event-timeline > li[data-tone]` holds `details` with `summary.rc-event-timeline__row` (`time`, `.rc-event-timeline__body`) and `pre.rc-event-timeline__details[tabindex="0"]`. Use a `div` row without a payload. `data-tone="muted"` draws a grey dot for routine events; `success` and `error` mark milestones.                                                                                                                                                                                              |
| People      | `.rc-person` holds `.rc-avatar` and a `span` with the name and `small`. Avatar: `data-size="sm\|lg"`, `data-shape="square"`, `data-tone="outline\|pending"`. `.rc-swatch` is a color square. Use `a.rc-person` for a row link: it inherits the text color, has no underline, and takes the accent-subtle hover.                                                                                                                                                                                                       |

### Native popover menus

Menus use the `popover` attribute and anchor to the element that invokes them.
Applies to `.rc-switcher-dropdown`, `.rc-profile-menu`, `.rc-dropdown__menu`,
and `.rc-popover__content`.

```html
<button class="rc-profile-menu__trigger" popovertarget="profile-menu">…</button>
<div class="rc-profile-menu" id="profile-menu" popover>…</div>
```

The invoker is the implicit anchor, so no anchor name is needed. To anchor to
another element, set `anchor-name: --x` on it and `--rc-anchor: --x` on the
popover. The popover opens below the anchor, flips when it runs out of room, and
`.rc-profile-menu` aligns to the anchor's end edge. The switcher is at least as
wide as its trigger. Browsers without `position-area` place the menu under the
top bar at the inline end.

### Copy buttons

```html
<button class="rc-button" data-copy data-copy-source="#token">
  <span data-copy-idle>Copy</span><span data-copy-done>Copied</span>
</button>
```

The copy behavior sets `data-copy-state="copied"` or `"failed"` for 1.6 seconds.
CSS swaps the visible label without changing the button width and tints the
border. The behavior also announces "Copied" (override with
`data-copy-done-label`) or "Copy failed" (`data-copy-failed-label`) in a polite
live region.

Pointer devices get compact rows. Touch devices (`pointer: coarse`) get 44px
targets.

### Toasts

Call `showToast` from `@reclaimprotocol/design/behaviors` instead of building
toast markup. You don't need `initReclaimBehaviors`.

```ts
import {showToast} from '@reclaimprotocol/design/behaviors';

showToast('The endpoint did not answer.', {
  title: 'Callback failed',
  tone: 'danger',
  placement: 'bottom-right',
});
```

- `tone` is `info` (default), `success`, `warning`, or `danger`.
- `placement` is `top|bottom` plus `left|center|right`. The default is
  `bottom-right`.
- `duration` is 5000 ms by default. Use `0` to keep the toast until it's
  dismissed. Hovering pauses the timer.
- The function returns the `output.toast` element and sets text with
  `textContent`, so pass plain strings. `clearToasts(placement?)` removes them.

Toasts render in one `div.toast-container[popover="manual"]` per placement,
appended to `document.body`. They follow the theme because dark tokens apply at
the document level. To render markup yourself, use `output.toast` with
`data-variant`, `.toast-title`, `.toast-message`, and `button[data-close]`
inside a `.toast-container` region.

### Site and public pages

| Pattern      | Markup                                                                                                                                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Surface      | `.rc-surface` stacks its children above `[data-reclaim-guilloche]`, like the app shell.                                                                                                                                                                                                                |
| Site app bar | `header.rc-app-bar[data-sticky]` holds `a.rc-app-bar__brand` (an `img` and `.rc-wordmark`), `nav.rc-app-bar__nav` with `.rc-nav-link` items, and `.rc-app-bar__actions`. At 640px and below the wordmark and `[data-hide-compact]` actions hide and the nav scrolls. Give the brand link `aria-label`. |
| Notice       | `.rc-notice` holds one `.rc-card` with `.rc-eyebrow`, `h1`, `p`, optional `ul`, and `.rc-notice__actions`. It's centered and 480px wide. `data-width="full"` buttons stretch.                                                                                                                          |
| Flow header  | `.rc-flow-shell__header` holds `img.rc-flow-shell__mark`, `.rc-flow-shell__title` (caps), `span.rc-flow-shell__subject` (ellipsized), and a trailing `.rc-button` that sits at the end. A plain `span` still sits at the end.                                                                          |

### Website cards and selection

| Pattern       | Markup                                                                                                                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Card grid     | `ul.rc-grid` or `ol.rc-grid` drops list styling; each `li` is a grid. Set `--rc-grid-min` for the column width.                                                                                                                                                                       |
| Link card     | `a.rc-card.rc-link-card[data-glass]` holds `.rc-link-card__head` (`strong`, `small`), `.rc-link-card__sub`, `.rc-link-card__desc`, `ul.rc-link-card__points`, and `.rc-link-card__foot[data-tone="warning\|danger"]`. `data-variant="add"` is the add tile with `strong` and `small`. |
| Selection bar | `form.rc-selection-bar` (or any element) holds `p` with `strong` and `small`, links, and a trailing `.rc-button`. It sticks to the top with an accent border.                                                                                                                         |
| Source note   | `.rc-source-note` holds an `svg`, `strong`, and `small`.                                                                                                                                                                                                                              |

### Charts

The app computes the data and renders the markup on the server. The package
supplies only CSS. Put a chart in `.rc-chart-frame__body` and name it with
`aria-label` on the list or `svg`.

| Chart        | Markup                                                                                                                                                                                                                                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tones        | Inside `.rc-chart-frame`, `data-tone="danger\|success\|warning\|muted"` sets the series color. No tone uses the accent.                                                                                                                                                                                                     |
| Legend       | `span.rc-chart-legend` holds `span[data-tone]` items. Put it in the frame header `meta`.                                                                                                                                                                                                                                    |
| Plot         | `.rc-chart-plot` holds `ol.rc-chart-plot__ticks` (top to bottom), `.rc-chart-plot__area`, and `ol.rc-chart-plot__labels`. The area draws four gridline intervals, so supply five ticks.                                                                                                                                     |
| Stacked bars | In the plot area, `ol.rc-bar-chart > li[tabindex="0"]` holds a `.rc-visually-hidden` summary and one `span[data-tone]` per segment with `style="block-size: N%"`. Hover and focus tint the column. To link a column, wrap its content in an `a` inside the `li` and drop the `li`'s `tabindex`.                             |
| Area         | In the plot area, `svg.rc-area-chart` (`viewBox="0 0 100 100"`, `preserveAspectRatio="none"`) with `path.rc-area-chart__fill` and `path.rc-area-chart__line`, then `ol.rc-area-chart__points > li[tabindex="0"]` positioned with `inset-inline-start` and `inset-block-start` percentages.                                  |
| Split bars   | `ol.rc-bar-list > li` holds `.rc-bar-list__label` and `.rc-bar-list__track` with `.rc-bar-list__bar[style="--share: 0..1"]` (child `span[data-tone]` with `flex-grow` values) and `.rc-bar-list__value`. Label width follows `--rc-chart-label-width`. A label or value can hold an `a`, which reads as text until hovered. |

Set `--rc-chart-bar-gap`, `--rc-chart-point-size`,
`--rc-chart-split-bar-height`, `--rc-chart-split-value-width`, and
`--rc-chart-label-width` to tune geometry.

## Apply the visual contract

- Use IBM Plex Mono for structural labels and IBM Plex Sans for explanatory
  text.
- Use 2px container corners, 1px borders, and no resting shadow.
- Build page surfaces from canvas color, the noise asset, and the centered
  scroll-linked guilloche.
- Use glass lift and cursor glow on cards and forms.
- Use glow without lift on reporting tiles.
- Keep tables, analytics plots, and navigation surfaces stable.
- Use a red hue for danger-button pointer and press treatments in both themes.
- Use tabular numerals for metrics, identifiers, timestamps, and prices.

## Apply interaction states

Every interactive component must define these applicable states:

- Resting
- Hover
- Touch or pen press
- Keyboard focus
- Active or selected
- Disabled
- Busy or loading
- Validation error
- Success, warning, and danger feedback

Pointer effects use element-relative percentage coordinates. Keyboard focus uses
a visible 2px racing-blue outline. Busy buttons preserve their label and width
while suppressing repeated activation. Validation reserves message space to
prevent layout movement.

Respect `prefers-reduced-motion`. Preserve meaning when motion and decorative
ornament are disabled.

## Apply accessibility rules

- Use native elements before ARIA substitutes.
- Provide visible labels for form controls.
- Associate validation messages with `aria-describedby`.
- Set `aria-invalid` when validation fails.
- Use `aria-expanded` and `aria-controls` for disclosures.
- Trap focus inside open dialogs and restore focus to their trigger.
- Support Escape for dismissible overlays.
- Maintain 44px touch targets.
- Communicate status with text or symbols in addition to color.
- Provide chart interaction through pointer, keyboard, and focus states.

## Apply responsive rules

- Use a 900px shell breakpoint.
- Use a 248px product sidebar above the shell breakpoint.
- Use bottom tabs and a menu sheet at or below the shell breakpoint.
- Collapse content grids by 560px.
- Display KPI tiles one per row by 344px.
- Keep the 198px documentation rail sticky on wide layouts and convert it to a
  sticky horizontal strip on narrow layouts.
- Contain overflow inside tables and long segmented controls.

## Handle browser-only entry points

Import `/elements`, `/behaviors`, and `/oat` from client code. Tokens and
DOM-free helpers have dedicated entry points that keep runtime boundaries
explicit.

For Vite applications, include the asset declarations:

```ts
// src/vite-env.d.ts
/// <reference types="vite/client" />
```

Use TypeScript `moduleResolution: "Bundler"` for modern bundler projects. The
package provides explicit declaration targets for all stylesheet exports.

## Verify an integration

An agent must complete this checklist:

1. Confirm that imports use public package entry points.
2. Confirm that tokens load before component CSS.
3. Run the consumer's TypeScript check.
4. Run lint and formatting checks.
5. Build the production bundle.
6. Test keyboard interaction and visible focus.
7. Test light and dark themes.
8. Test hover and touch or pen press feedback.
9. Test reduced motion and high text scaling.
10. Test desktop, tablet, and phone widths for page-level overflow.
11. Run accessibility automation and review dialog focus manually.
12. Confirm that unused browser behaviors and elements stay out of the bundle.

## Agent task template

Use this prompt when assigning an integration:

```text
Integrate @reclaimprotocol/design using DESIGN.md as the implementation
contract. Use only public package exports. Load tokens before component CSS.
Compose product-specific UI from generic primitives, keep application state and
domain logic outside the design package, and verify TypeScript, production
build, keyboard access, both themes, responsive layouts, reduced motion, and
touch and pointer states.
```
