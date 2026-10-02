# Architecture

The repository has one publishable SDK with independently addressable web entry
points.

```text
tokens/**/*.tokens.json ── build-tokens.mjs ── CSS + TypeScript

specs/*.yaml ─┬─ semantic HTML/CSS contracts
              ├─ framework-neutral ESM behaviors
              ├─ optional custom elements
              └─ React components and charts

@reclaimprotocol/design
├── /css
├── /behaviors
├── /react
├── /charts
└── /brand
```

## Sources of truth

1. Token JSON owns visual values.
2. Component specifications own public variants, states, interaction and
   accessibility.
3. `src` owns the TypeScript and CSS source for every published web entry point.
4. The catalog is executable usage documentation.

## Package boundary

CSS classes are the base API because they work in static HTML, HTMX, server JSX,
React and Vite applications. Custom elements are reserved for complex
self-contained controls. React composes semantic elements and uses the same CSS
rather than forking the styling system.

The package export map is the public boundary. Every export points to compiled
output under `dist`; consumers never execute TypeScript source. Root and
framework-neutral subpaths do not import React. `/react` and `/charts` are
separately compiled entry points, with React declared as an optional peer
dependency. CSS has explicit opt-in entry points and is marked as
side-effectful; JavaScript modules otherwise remain tree-shakeable.

The lowest CSS layer is a pinned source fork of Oat under `src/oat`. `src/css`
maps Oat variables to Reclaim tokens, then layers branded geometry, surfaces,
interactions and components above it. Vendored provenance and license files live
under `vendor/oat`.
