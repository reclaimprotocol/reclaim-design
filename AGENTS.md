# Reclaim Design agent instructions

@/Users/syed/.codex/RTK.md

## Scope and source of truth

This repository is the reusable Reclaim web design system for semantic HTML,
CSS, and framework-neutral JavaScript.

Use this source priority:

1. `DESIGN.md` for consumer integration and visual rules.
2. `specs/*.yaml` for component behavior and accessibility contracts.
3. `tokens/**/*.tokens.json` for visual values.
4. `apps/catalog` for executable component examples.

## Architecture

- Author shared values only in `tokens/**/*.tokens.json`.
- Run `npm run tokens:build` after token changes and commit generated artifacts
  under `src/tokens/`.
- Keep all root-level publishable code inside the single
  `@reclaimprotocol/design` package.
- Keep `src/css` framework-neutral and semantic.
- Keep DOM behavior in `src/behaviors`; basic content must work without it.
- Extend the pinned Oat foundation through Reclaim tokens, semantic classes,
  delegated behaviors, and small custom elements. Don't edit vendored Oat.
- Reserve `src/elements` for stateful composites that native HTML and delegated
  behavior can't express clearly.
- Don't add framework components or framework dependencies. Framework
  applications render the documented semantic markup themselves.
- Preserve separate ESM entry points and named exports so consumers can
  tree-shake unused code. Keep CSS as an explicit opt-in side effect.

## Code and documentation style

- Follow `docs/style-guide.md` for all authored code and documentation.
- Run `npm run style:fix` after editing supported text files and
  `npm run style:check` before verification.
- Keep project-specific design, accessibility, public API, and licensing rules
  when Google style guidance doesn't cover a case.
- Don't reformat vendored Oat, generated token/build output, lockfiles, or
  binary assets. Change their source or generator instead.

## Visual and interaction contract

- Preserve the hard-edged system: 2px corners, 1px borders, no resting shadow.
- Use IBM Plex Mono for structure and IBM Plex Sans for explanation.
- Keep the three-layer surface: color, 200px noise tile under the theme wash,
  and the 26-ring scroll-linked guilloche.
- Pointer treatments must use element-relative percentage coordinates.
- Desktop hover and touch/pen press must both expose a visible response.
- Glass cards lift 2px and reveal their backing panel; reporting tiles glow but
  never lift; buttons lift 1px and press to 0.965 over 90ms.
- Focus is always a visible 2px racing-blue outline, never a glow.
- Busy buttons retain both label and spinner, preserve width, and suppress
  repeat activation without taking disabled opacity.
- Validation happens on blur and couples message, border, and `aria-invalid`.
- Dialogs trap focus, close on Escape/outside press, and restore trigger focus.
- Respect `prefers-reduced-motion` and maintain 44px touch targets.

## Accessibility and responsive behavior

- Use native semantic controls before ARIA substitutes.
- Do not use color as the only status signal.
- Product shell breakpoint is 900px: 248px sidebar above it, bottom tabs and a
  menu sheet at or below it. Content grids collapse by 560px; KPI tiles become
  one-up by 344px.
- The document/reference rail is 198px and must become a sticky horizontal strip
  on narrow screens. Do not confuse it with the product sidebar.
- Page-level horizontal scrolling is a regression. Tables and long segmented
  controls may scroll inside their own containers.

## Assets and licensing

- Use local assets in `assets/brand`; never hotlink them.
- Keep charts in consuming applications and apply the documented chart markup,
  tokens, and interaction contract.
- GnuMICR is optional ornament and must never carry required information.
- Read `THIRD_PARTY_NOTICES.md` before packaging GnuMICR. Treat the font files
  as development-only assets under the repository's current licensing policy.

## Verification

For web changes, run:

```sh
npm run verify:full
```

Update the deterministic catalog and tests whenever a visual state, interaction,
responsive rule, or public component contract changes.
