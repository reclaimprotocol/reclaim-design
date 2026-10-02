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
`--rc-card-padding`.

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
