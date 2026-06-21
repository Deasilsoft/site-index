# @site-index/core

Deterministic SEO artifact engine for sitemap and robots generation.

[![npm version](https://img.shields.io/npm/v/@site-index/core)](https://www.npmjs.com/package/@site-index/core)
[![Code Quality](https://github.com/Deasilsoft/site-index/actions/workflows/code-quality.yml/badge.svg?branch=main)](https://github.com/Deasilsoft/site-index/actions/workflows/code-quality.yml)
[![Code Coverage](https://codecov.io/gh/Deasilsoft/site-index/graph/badge.svg?flag=@site-index/core)](https://codecov.io/gh/Deasilsoft/site-index)
[![Socket](https://badge.socket.dev/npm/package/@site-index/core)](https://socket.dev/npm/package/@site-index/core)

[Repository README](../../../)

## What problem this package solves

Teams often need sitemap and robots generation outside one framework, but still want:

- strict validation of route metadata
- deterministic output ordering
- deduplication and warning surfaces
- reusable logic across CLI, Vite, and custom build systems

`@site-index/core` is that reusable engine. It is framework-agnostic and leaves module loading strategy to the caller.

## Install

```bash
npm install @site-index/core
```

Requirements:

- Node.js `>=22`

## When to use core directly

Use `@site-index/core` when you want programmatic control and provide your own `loadModule` implementation.

Use higher-level packages if you do not need custom integration plumbing:

- CLI: [`site-index`](../../site-index/)
- Vite integration: [`@site-index/vite-plugin`](../vite-plugin/)

## Public API

```ts
main(options: Options): Promise<Result<readonly Artifact[]>>
```

Key types:

```ts
type Options = {
  siteUrl: string;
  rootPath: string;
  extensions?: string[];
  loadModule: LoadModule;
};

type LoadModule = (module: Module) => Promise<ModuleExports>;

type Module = {
  filePath: string;
  importId: string;
};

type ModuleExports = {
  siteIndexes: SiteIndex[];
};
```

## SiteIndex model

```ts
type SiteIndex = {
  url: `/${string}`;
  lastModified?: string;
  sitemap?: string;
  index?: boolean;
};
```

Validation highlights:

- `url` must start with `/`
- `url` cannot include query strings or hash fragments
- `lastModified` accepts ISO date / ISO datetime with offset
- `sitemap` defaults to `pages`
- `sitemap` must match lowercase slug segments (`^[a-z0-9]+(-[a-z0-9]+)*$`)
- `index` defaults to `true`
- `index: false` removes URL from sitemap files and adds `Disallow` in `robots.txt`

## Pipeline stages

`main(...)` runs a deterministic pipeline:

1. resolve and validate options
2. discover `*.site-index.*` files
3. load modules through caller `loadModule`
4. validate exported data
5. deduplicate and sort route entries
6. generate deterministic artifacts as frozen `Artifact` objects in a frozen collection
7. return warnings for recoverable issues

Immutability scope:

- each `Artifact` object is frozen
- the returned artifact collection is frozen
- the `Result` object and warning collection are not documented as immutable

Warning categories include:

- no modules found
- failed module load
- invalid module exports
- duplicate URLs

## Generated artifacts

- `sitemap.xml`
- `sitemap-<name>.xml`
- `robots.txt`

Content types:

- `.xml` -> `application/xml; charset=utf-8`
- `.txt` -> `text/plain; charset=utf-8`

## Example

```ts
import { main } from "@site-index/core";
import type { Module, ModuleExports } from "@site-index/core";

const result = await main({
  siteUrl: "https://example.com",
  rootPath: process.cwd(),
  extensions: [".mjs"],
  loadModule: async (module: Module): Promise<ModuleExports> => {
    const loaded = await import(module.filePath);

    return loaded.default as ModuleExports;
  },
});
```

## Related packages

- [`site-index`](../../site-index/)
- [`@site-index/vite-plugin`](../vite-plugin/)
- [`@site-index/vite-runtime`](../vite-runtime/)
- [`@site-index/observability`](../observability/)
