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

## Semantic form patterns

Build fields from native controls. The `rc-` classes provide the visual contract
without owning application state:

```html
<label class="rc-field">
  <span class="rc-field__label">Format</span>
  <select class="rc-select" name="format">
    <option value="feed">Feed · 1:1</option>
    <option value="story">Story · 9:16</option>
  </select>
  <span class="rc-field__message">Choose an output format.</span>
</label>
```

Use a fieldset and native radio inputs for descriptive, exclusive choices:

```html
<fieldset class="rc-radio-cards">
  <legend>Publishing policy</legend>
  <label class="rc-radio-card">
    <input name="policy" type="radio" value="review" checked />
    <span class="rc-radio-card__content">
      <strong>Review before publish</strong>
      <small>A person approves every change.</small>
    </span>
  </label>
</fieldset>
```

Listen to native `change` events in the application. TypeScript consumers can
import the public event and state contracts from `@reclaimprotocol/design`.

## Tabs

Use Oat's custom element with Reclaim classes instead of a framework wrapper:

```html
<ot-tabs class="rc-tabs">
  <div role="tablist" aria-label="Asset details">
    <button role="tab" type="button" aria-selected="true">Preview</button>
    <button role="tab" type="button">Metadata</button>
  </div>
  <div role="tabpanel">Preview content</div>
  <div role="tabpanel">Metadata content</div>
</ot-tabs>
```

Load `@reclaimprotocol/design/oat` once at the browser boundary. The element
emits `ot-tab-change` with the active `index` and `tab` in `event.detail`.

## Semantic state attributes

- Use `data-variant` for a component's stable visual variant.
- Use `data-state` for its current state.
- Pair busy states with `aria-busy`.
- Pair errors with `aria-invalid` and a visible message.
- Prefer native `disabled`; use `aria-disabled` when native disabling is
  unavailable.

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

## Compose framework applications

Static HTML, HTMX, KitaJS, server-rendered JSX, and client frameworks use the
same semantic markup. Import `@reclaimprotocol/design/behaviors` for progressive
enhancement. Application components own state and render the documented native
elements, `rc-` classes, attributes, and custom elements. Vite and other modern
bundlers consume the JavaScript entries as ESM and can tree-shake unused named
exports.

Oat's custom-element runtime is optional and browser-only:

```js
import '@reclaimprotocol/design/oat';
```

Do not import that entry during server rendering. Register Reclaim custom
elements separately when the page uses a stateful composite:

```js
import {defineReclaimElements} from '@reclaimprotocol/design/elements';

defineReclaimElements();
```

`rc-local-asset-field` accepts validation attributes and an optional async
`prepare` property. It emits `reclaim:assetchange`, `reclaim:assetstatechange`,
and `reclaim:assetclear`. `rc-image-editor` accepts its source through the
`source` property, opens with `open()`, and emits `reclaim:imageapply` with a
PNG data URL. The consuming application composes these elements and owns the
final asset value.
