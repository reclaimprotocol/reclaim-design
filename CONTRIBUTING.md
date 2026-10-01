# Contributing

Every component change must include:

1. A contract change in `specs` when public behavior changes.
2. A web implementation and catalog state.
3. Keyboard, accessibility, and state tests.
4. A changeset or clear release note when the public API changes.

Don't edit generated files. Change the token JSON and run
`npm run tokens:build`.

Follow the repository's [style guide](docs/style-guide.md). Apply safe automatic
fixes before verification:

```sh
npm run style:fix
npm run verify
```

Review visual changes in light and dark themes, at high text scaling, in narrow
layouts, and with reduced motion enabled. Raw values in components require a
comment that explains why no token applies.
