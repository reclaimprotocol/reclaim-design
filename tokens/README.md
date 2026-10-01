# Reclaim tokens

`core.tokens.json` contains raw, stable primitives. `semantic.tokens.json` maps
component decisions to semantic roles. `themes/*.tokens.json` supplies light and
dark semantic values.

Run `node scripts/build-tokens.mjs` after changing a token. Generated web
artifacts are committed under `src/tokens/`; do not edit them by hand. Product
CSS must use `--rc-` semantic or component variables, rather than core colour
values.

The token values implement the visual contract in [`DESIGN.md`](../DESIGN.md).
