# Reclaim Design

`@reclaimprotocol/design` is Reclaim Protocol's web design system for semantic
HTML, HTMX, server-rendered templates, React, and modern JavaScript bundlers.
The package includes TypeScript declarations, framework-neutral behaviors, React
components, interactive charts, design tokens, CSS, icons, and optional custom
elements.

The source is TypeScript at the repository root. Published applications consume
compiled ESM and declaration files from `dist`; they don't compile the SDK
source.

## Install the package

Install the package with your package manager:

```sh
npm install @reclaimprotocol/design
```

Install a tagged Git revision directly when the repository is the package
source:

```sh
npm install "git+https://<repository-url>.git#v1.0.0"
```

Or declare the package name explicitly:

```json
{
  "dependencies": {
    "@reclaimprotocol/design": "git+ssh://git@<repository-url>.git#v1.0.0"
  }
}
```

The root `prepare` script compiles `dist` for Git installations. Pin a tag or
commit for deterministic dependency resolution.

React entry points use React as an optional peer dependency. Install React when
you use `/react` or `/charts`:

```sh
npm install @reclaimprotocol/design react react-dom
```

## Load the styles

Import tokens before component styles in your application's JavaScript or CSS
entry point:

```ts
import '@reclaimprotocol/design/tokens.css';
import '@reclaimprotocol/design/css';
```

The complete CSS entry includes the pinned Oat foundation, Reclaim's token
bridge, components, interaction effects, and utilities. Add application
overrides after these imports.

You can import smaller style entry points when you manage the cascade yourself:

```ts
import '@reclaimprotocol/design/tokens.css';
import '@reclaimprotocol/design/css/base';
import '@reclaimprotocol/design/css/components';
import '@reclaimprotocol/design/css/effects';
import '@reclaimprotocol/design/css/utilities';
```

## Use semantic HTML, HTMX, or templates

Render normal HTML with the public `rc-` classes. JavaScript enhancement is
optional for static controls.

```html
<button class="rc-button" data-variant="primary">Verify claim</button>

<label class="rc-field">
  <span class="rc-field__label">Provider identifier</span>
  <input class="rc-input" name="provider" />
</label>
```

Initialize delegated behaviors once in the browser for dialogs, copy actions,
comboboxes, expansion controls, themes, pointer effects, and the guilloche:

```ts
import {initReclaimBehaviors} from '@reclaimprotocol/design/behaviors';

const reclaim = initReclaimBehaviors(document);

// Call this when your application is unmounted.
reclaim.destroy();
```

Delegated event handling continues to work when HTMX or another server-driven
framework replaces fragments.

## Use React components

```tsx
import {
  Button,
  Card,
  Field,
  ReclaimThemeProvider,
} from '@reclaimprotocol/design/react';
import '@reclaimprotocol/design/tokens.css';
import '@reclaimprotocol/design/css';

export function VerificationForm() {
  return (
    <ReclaimThemeProvider defaultTheme="system">
      <Card>
        <Field label="Callback URL" name="callback" type="url" />
        <Button type="submit">Save callback</Button>
      </Card>
    </ReclaimThemeProvider>
  );
}
```

React components use the same semantic classes and tokens as framework-neutral
HTML. They don't require the Oat JavaScript runtime.

## Use interactive charts

Charts are exposed separately so applications that don't use them don't bundle
their code.

```tsx
import {AreaChart, type ChartDatum} from '@reclaimprotocol/design/charts';

const activity: ChartDatum[] = [
  {label: 'Mon', value: 18},
  {label: 'Tue', value: 31},
  {label: 'Wed', value: 25},
];

export function ActivityChart() {
  return <AreaChart data={activity} label="Daily activity" />;
}
```

## Use tokens in TypeScript

```ts
import {
  coreTokens,
  cssVariable,
  themes,
  type TokenPath,
} from '@reclaimprotocol/design/tokens';

const token: TokenPath = 'color.action.primary';
const customProperty = cssVariable(token);
const darkPrimary = themes.dark[token];
```

Prefer CSS custom properties in UI code. Typed values are useful for tooling,
data visualization, and integrations that can't read CSS.

## Use icons

The framework-neutral icon entry returns local SVG strings:

```ts
import {icon} from '@reclaimprotocol/design/icons';

const accessibleIcon = icon('shieldCheck', 'Verified');
```

React applications can place the SVG in a trusted rendering boundary or wrap the
icon entry with their own icon component.

## Use custom elements

The custom-element entry is browser-only because it extends `HTMLElement`:

```ts
import {defineReclaimElements} from '@reclaimprotocol/design/elements';

defineReclaimElements();
```

Load it in a client entry point or dynamic import, not during server rendering.
The optional vendored Oat runtime is also browser-only:

```ts
await import('@reclaimprotocol/design/oat');
```

## Select a theme

Set `data-theme` on the nearest theme boundary:

```html
<main class="rc-surface" data-theme="dark">
  <!-- Application content -->
</main>
```

Use `ReclaimThemeProvider` in React or `createThemeController` from
`@reclaimprotocol/design/behaviors` when the choice must follow the system theme
or persist in local storage.

## Preserve tree shaking

Import the narrowest entry point that matches your runtime:

```ts
import {Button} from '@reclaimprotocol/design/react';
import {BarChart} from '@reclaimprotocol/design/charts';
import {createDialogController} from '@reclaimprotocol/design/behaviors';
```

Don't import files from `@reclaimprotocol/design/dist` directly. The package's
public export map provides stable entry points, generated declarations, and
separate ESM modules. CSS and browser registration modules are intentionally
marked as side effects; other modules use named exports for tree shaking.

## Configure TypeScript and Vite

Vite projects should use bundler module resolution and include Vite's ambient
asset declarations:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler"
  }
}
```

Add this file when the project doesn't already contain it:

```ts
// src/vite-env.d.ts
/// <reference types="vite/client" />
```

The package publishes explicit declaration targets for `/css`, `/tokens.css`,
and the other stylesheet exports. Current TypeScript versions can therefore
resolve package CSS imports through the export map. Vite's declaration remains
necessary for local imports such as `./app.css`.

For a bundler that doesn't provide CSS declarations, add a project declaration:

```ts
// src/assets.d.ts
declare module '*.css';
```

### Fix stale CSS import diagnostics

If VS Code reports error `TS2882` for a package stylesheet:

1. Confirm that the installed package is current with
   `npm ls @reclaimprotocol/design`.
2. Reinstall dependencies if the package's `exports` map is stale.
3. Run your project's TypeScript check outside the editor.
4. In VS Code, run **TypeScript: Select TypeScript Version**, select the
   workspace version, and then run **TypeScript: Restart TS Server**.
5. For a local repository checkout, build the SDK with `npm run build:sdk`
   before opening the consumer.

Don't work around package CSS errors by importing private `dist` files. Report
an unresolved public entry point as a package issue instead.

## Build the package from source

From the repository root, run:

```sh
npm install
npm run tokens:build
npm run build:sdk
```

The build performs these operations:

1. Cleans the package `dist` directory.
2. Compiles TypeScript to ESM JavaScript.
3. Generates `.d.ts` declarations and declaration maps.
4. Copies CSS, token styles, fonts, images, and vendored Oat assets.

Run the complete verification suite before publishing:

```sh
npm run verify:full
```

## Public entry points

| Entry point                              | Purpose                       | Runtime            |
| ---------------------------------------- | ----------------------------- | ------------------ |
| `@reclaimprotocol/design`                | Behaviors and icons barrel    | Browser or bundler |
| `@reclaimprotocol/design/behaviors`      | Progressive DOM enhancement   | Browser            |
| `@reclaimprotocol/design/behaviors/core` | DOM-free behavior helpers     | Any ESM runtime    |
| `@reclaimprotocol/design/react`          | React components              | React              |
| `@reclaimprotocol/design/charts`         | Interactive React SVG charts  | React              |
| `@reclaimprotocol/design/elements`       | Custom-element registration   | Browser only       |
| `@reclaimprotocol/design/icons`          | SVG icon strings              | Any ESM runtime    |
| `@reclaimprotocol/design/tokens`         | Typed token values            | Any ESM runtime    |
| `@reclaimprotocol/design/tokens.css`     | Token variables and themes    | CSS bundler        |
| `@reclaimprotocol/design/css`            | Complete component stylesheet | CSS bundler        |
| `@reclaimprotocol/design/oat`            | Optional Oat runtime          | Browser only       |

## Licensing

Read the included `THIRD_PARTY_NOTICES.md` before publishing or redistributing
builds that include the optional GnuMICR font assets. Oat's MIT license and
provenance records are also included in the npm package.
