# Web usage

## Styles

Load tokens before components. Local application overrides should come last.

```css
@import '@reclaimprotocol/design/tokens.css';
@import '@reclaimprotocol/design/css';

@layer app-overrides {
  .billing-summary {
    --rc-card-padding: 32px;
  }
}
```

The component entry includes the pinned Oat foundation in the lower `oat`
cascade layer.

## Theming

Set `data-theme` on the nearest theme boundary:

```html
<main class="rc-surface" data-theme="dark">…</main>
```

Use `createThemeController` from `@reclaimprotocol/design/behaviors` when the
selection must persist. Avoid reading visual token values in application
JavaScript.

## Progressive behavior

The behavior entry uses event delegation and stable hooks such as `data-glass`,
`data-tile`, `data-segment`, `data-combobox`, and `data-dialog-open`.
Server-rendered fragments can therefore be swapped without mounting a component
framework.

Interactive components must retain native semantics:

- Buttons use `<button>`.
- Fields retain visible labels.
- Dialog triggers reference a native `<dialog>`.
- Exclusive choices expose `aria-pressed` or radio semantics.
- Expansion triggers expose `aria-expanded` and `aria-controls`.
- Validation errors use `aria-invalid` and `aria-describedby`.

## Framework entry points

Static HTML, HTMX, Kitajs, and server-rendered JSX can use CSS with no runtime.
Import `@reclaimprotocol/design/behaviors` for progressive enhancement. React
applications use `@reclaimprotocol/design/react`, with charts in
`@reclaimprotocol/design/charts`. Vite and other modern bundlers consume all
entries as ESM and can tree-shake unused named exports.

Oat's custom-element runtime is optional and browser-only:

```js
import '@reclaimprotocol/design/oat';
```

Do not import that entry during server rendering. React components implement
their own controlled state and do not require it.
