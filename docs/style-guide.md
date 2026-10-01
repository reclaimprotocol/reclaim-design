# Style guide

This repository follows Google's language-specific code style guides and the
Google developer documentation style guide. Project-specific accessibility,
design-system, API, and licensing requirements take precedence when the guides
don't address a case.

## Source code

- Use 2-space indentation, semicolons, single-quoted JavaScript and TypeScript
  strings, trailing commas, and an 80-column target.
- Use ESM imports and exports. Keep imports before implementation code.
- Author SDK and catalog runtime code in TypeScript. Publish only compiled
  JavaScript and generated declarations from `dist`.
- Use `const` by default and `let` only when reassignment is necessary.
- Use braces for every control structure and one statement per line.
- Don't use `eval`, `Function` string constructors, implicit globals, or
  modifications to built-in prototypes.
- Keep HTML semantic and valid. Separate structure, presentation, and behavior.
- Use meaningful CSS class names and lowercase hyphenated custom properties.
- Preserve the existing `rc-` prefix because it is part of the public API.
- Use double quotes for HTML attribute values.

Run `npm run style:fix` to apply safe automatic fixes. Run `npm run style:check`
before submitting changes.

## Documentation

- Write in active voice and address the reader as “you.”
- Use US English and clear language that works for a global audience.
- Use sentence case for headings and one level-one heading per document.
- Use descriptive link text and code formatting for filenames, commands,
  identifiers, and literal values.
- Use numbered lists for procedures and bulleted lists for unordered material.
- Label fenced code blocks with their language.
- Wrap prose at 80 columns when practical. Links, tables, headings, and code
  blocks can exceed that limit.

## Exclusions

Don't directly reformat or lint the following files:

- Generated token and build artifacts.
- Vendored Oat source under `src/oat`.
- Binary assets, font files, and package lockfiles.

Change the generator or pinned vendor source instead. Generated output is
covered by build, type, token-drift, and browser tests.

## References

- [Google developer documentation style guide](https://developers.google.com/style)
- [Google TypeScript style guide](https://google.github.io/styleguide/tsguide.html)
- [Google JavaScript style guide](https://google.github.io/styleguide/jsguide.html)
- [Google HTML/CSS style guide](https://google.github.io/styleguide/htmlcssguide.html)
- [Google Markdown style guide](https://google.github.io/styleguide/docguide/style.html)
