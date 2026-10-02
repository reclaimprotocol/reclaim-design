# Architecture

The repository has one publishable SDK with independently addressable web entry
points.

```text
tokens/**/*.tokens.json ── build-tokens.mjs ── CSS + TypeScript

specs/*.yaml ─┬─ semantic HTML/CSS contracts
              ├─ framework-neutral ESM behaviors
              └─ custom elements for stateful composites

@reclaimprotocol/design
├── /css
├── /behaviors
├── /elements
├── /icons
└── /brand
```

## Sources of truth

1. Token JSON owns visual values.
2. Component specifications own public variants, states, interaction and
   accessibility.
3. `src` owns the TypeScript and CSS source for every published web entry point.
4. The catalog is executable usage documentation.

## Package boundary

CSS classes and semantic markup are the base API because they work in static
HTML, HTMX, server JSX, and client framework applications. Framework
applications render this markup themselves rather than importing SDK framework
components. Delegated behaviors enhance document-level patterns. Custom elements
are reserved for complex, self-contained state machines such as local asset
preparation and image editing.

The package export map is the public boundary. Every export points to compiled
output under `dist`; consumers never execute TypeScript source. Public entry
points don't depend on an application framework. CSS has explicit opt-in entry
points and is marked as side-effectful; JavaScript modules otherwise remain
tree-shakeable.

The lowest CSS layer is a pinned source fork of Oat under `src/oat`. `src/css`
maps Oat variables to Reclaim tokens, then layers branded geometry, surfaces,
interactions and components above it. Vendored provenance and license files live
under `vendor/oat`.

Use Oat elements such as `ot-tabs` when the pinned runtime already provides the
required behavior. Add Reclaim classes and tokens instead of duplicating the
state machine. Add an `rc-` custom element only when native HTML, Oat, and
delegated behavior don't provide the required lifecycle or property API.
