# @site-index/vite-plugin

Vite plugin for deterministic sitemap.xml and robots.txt generation in dev and build.

[![npm version](https://img.shields.io/npm/v/@site-index/vite-plugin)](https://www.npmjs.com/package/@site-index/vite-plugin)
[![Code Quality](https://github.com/Deasilsoft/site-index/actions/workflows/code-quality.yml/badge.svg?branch=main)](https://github.com/Deasilsoft/site-index/actions/workflows/code-quality.yml)
[![Code Coverage](https://codecov.io/gh/Deasilsoft/site-index/graph/badge.svg?flag=@site-index/vite-plugin)](https://codecov.io/gh/Deasilsoft/site-index)
[![Socket](https://badge.socket.dev/npm/package/@site-index/vite-plugin)](https://socket.dev/npm/package/@site-index/vite-plugin)

[Repository README](../../../)

## What problem this plugin solves

Vite apps often need SEO artifacts (`sitemap.xml`, segmented sitemaps, `robots.txt`) but generating them outside Vite creates drift between:

- development preview behavior
- build output behavior
- CI artifact validation

`@site-index/vite-plugin` keeps this inside the Vite dev and build lifecycle by integrating artifact generation into Vite hooks.

## Install

```bash
npm install -D @site-index/vite-plugin
```

Requirements:

- Node.js `>=22`
- peer dependency: `vite ^8.0.10`

## Quickstart

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

## Public API

Recommended entry point:

- `siteIndexPlugin(options): Vite.Plugin[]`

Lower-level exports:

- `siteIndexBuildPlugin(options): Vite.Plugin`
- `siteIndexServePlugin(options): Vite.Plugin`

Options:

```ts
type Options = Pick<CoreOptions, "siteUrl" | "extensions">;
```

## How it works

`siteIndexPlugin(options)` returns two plugins:

1. `siteIndexServePlugin(options)`
2. `siteIndexBuildPlugin(options)`

### Serve behavior

- runs in Vite dev server (`apply: "serve"`)
- builds artifacts during `configureServer`
- serves:
  - `/sitemap.xml`
  - `/sitemap-<name>.xml`
  - `/robots.txt`
- rebuilds on hot updates for watched files
- logs warnings/errors through `@site-index/observability`

### Build behavior

- runs during Vite build (`apply: "build"`)
- builds artifacts in `buildStart`
- emits generated files as build assets in `generateBundle`
- closes runtime resources in `closeBundle`

## When to use this vs other packages

- Use this package when build-time artifact generation fits your Vite deployment model.
- For SSR deployments that also need post-deploy regeneration, pair this package with [`site-index`](../../site-index/).
- Use [`@site-index/core`](../core/) for custom runtime/loaders.

## Related packages

- [`@site-index/core`](../core/)
- [`@site-index/vite-runtime`](../vite-runtime/)
- [`@site-index/observability`](../observability/)
- [`site-index`](../../site-index/)
