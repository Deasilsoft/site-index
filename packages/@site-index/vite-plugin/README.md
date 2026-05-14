# @site-index/vite-plugin

Vite integration layer for site-index serve and build pipelines.

[![npm version](https://img.shields.io/npm/v/%40site-index%2Fvite-plugin)](https://www.npmjs.com/package/%40site-index%2Fvite-plugin)
[![Code Quality](https://github.com/Deasilsoft/site-index/actions/workflows/code-quality.yml/badge.svg?branch=main)](https://github.com/Deasilsoft/site-index/actions/workflows/code-quality.yml)
[![Code Coverage](https://codecov.io/gh/Deasilsoft/site-index/graph/badge.svg?flag=%40site-index%2Fvite-plugin)](https://codecov.io/gh/Deasilsoft/site-index)
[![Socket](https://badge.socket.dev/npm/package/%40site-index%2Fvite-plugin)](https://socket.dev/npm/package/%40site-index%2Fvite-plugin)

[Repository README](../../../)

## Install

```bash
npm install -D @site-index/vite-plugin
```

Requirements:

- Node.js `>=22`
- peer dependency: `vite ^8.0.10`

## When to use

Use this package when your project already uses Vite and you want sitemap and robots.txt artifacts handled during dev and build.

## Public exports

```ts
export { siteIndexBuildPlugin } from "./domains/build/build.plugin.js";
export { siteIndexServePlugin } from "./domains/serve/serve.plugin.js";
export { siteIndexPlugin } from "./main.js";
```

## Public API

Recommended default:

- `siteIndexPlugin(options): Vite.Plugin[]`

Lower-level exports:

- `siteIndexBuildPlugin(options): Vite.Plugin`
- `siteIndexServePlugin(options): Vite.Plugin`

Options:

```ts
type Options = Pick<CoreOptions, "siteUrl" | "extensions">;
```

## Behavior

`siteIndexPlugin(options)` returns:

- `siteIndexServePlugin(options)`
- `siteIndexBuildPlugin(options)`

Serve plugin:

- applies in Vite dev server
- creates runtime from the existing Vite dev server
- builds artifacts during `configureServer`
- serves generated artifact paths such as:
  - `/sitemap.xml`
  - `/sitemap-<name>.xml`
  - `/robots.txt`
- returns headers only for `HEAD` requests
- rebuilds on hot updates when changed files are in runtime watched files
- logs warnings/errors via `@site-index/observability`

Build plugin:

- applies during Vite build
- creates runtime from resolved Vite config
- builds artifacts in `buildStart`
- emits generated artifacts as assets in `generateBundle`
- closes runtime in `closeBundle`
- logs warnings through `@site-index/observability`

## Example

```ts
import { defineConfig } from "vite";
import { siteIndexPlugin } from "@site-index/vite-plugin";

export default defineConfig({
  plugins: [
    siteIndexPlugin({
      siteUrl: "https://example.com",
    }),
  ],
});
```

## Related packages

- [`@site-index/core`](../core/)
- [`@site-index/vite-runtime`](../vite-runtime/)
- [`@site-index/observability`](../observability/)
- [`site-index`](../../site-index/)
