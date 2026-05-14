# @site-index/core

Deterministic site-index pipeline for config resolution, discovery, loading, validation, deduplication, and artifact generation.

[![npm version](https://img.shields.io/npm/v/%40site-index%2Fcore)](https://www.npmjs.com/package/%40site-index%2Fcore)
[![Code Quality](https://github.com/Deasilsoft/site-index/actions/workflows/code-quality.yml/badge.svg?branch=main)](https://github.com/Deasilsoft/site-index/actions/workflows/code-quality.yml)
[![Code Coverage](https://codecov.io/gh/Deasilsoft/site-index/graph/badge.svg?flag=%40site-index%2Fcore)](https://codecov.io/gh/Deasilsoft/site-index)
[![Socket](https://badge.socket.dev/npm/package/%40site-index%2Fcore)](https://socket.dev/npm/package/%40site-index%2Fcore)

[Repository README](../../../)

## Install

```bash
npm install @site-index/core
```

Requirements:

- Node.js `>=22`

## When to use

Use `@site-index/core` when you need programmatic control and can provide module loading yourself.

## When not to use

- Use [`site-index`](../../site-index/) for CLI-driven workflows.
- Use [`@site-index/vite-plugin`](../vite-plugin/) for Vite projects.

## Public exports

```ts
export { Artifact } from "./domains/artifacts/artifact.js";
export type { LoadModule, Options } from "./domains/options/types.js";
export type * from "./domains/site-indexes/types.js";
export type { Warning, Result } from "./types.js";
export { main } from "./main.js";
```

## Main API

```ts
main(options: Options): Promise<Result<Artifact[]>>
```

Options:

```ts
type Options = {
  siteUrl: string;
  rootPath: string;
  extensions?: string[] | undefined;
  loadModule: LoadModule;
};
```

`LoadModule`:

```ts
type LoadModule = (module: Module) => Promise<ModuleExports>;
```

`Module`:

```ts
type Module = {
  filePath: string;
  importId: string;
};
```

`ModuleExports`:

```ts
type ModuleExports = {
  siteIndexes: SiteIndex[];
};
```

## Site index type

```ts
type SiteIndex = {
  url: `/${string}`;
  lastModified?: string | undefined;
  sitemap?: string | undefined;
  index?: boolean | undefined;
};
```

Validation rules:

- `url` must start with `/`
- `url` cannot contain query strings or fragments
- `lastModified` is optional
- `lastModified` must be an ISO date or an ISO datetime with offset
- `sitemap` is optional
- `sitemap` defaults to `pages`
- `sitemap` must be lowercase and can include hyphens
- `index` is optional
- `index` defaults to `true`
- `index: false` excludes the URL from sitemap artifacts and adds `Disallow: <path>` to `robots.txt`

## Artifacts

Generated:

- `sitemap.xml`
- `sitemap-<name>.xml`
- `robots.txt`

Artifact content types:

- `.xml` -> `application/xml; charset=utf-8`
- `.txt` -> `text/plain; charset=utf-8`

## Pipeline behavior

`main(...)`:

- resolves options
- discovers `*.site-index.*` modules
- loads modules via caller-provided `loadModule`
- validates module exports
- resolves and deduplicates site index entries
- sorts output deterministically
- generates immutable artifacts
- returns warnings for recoverable issues

Warning categories include:

- no modules found
- failed module load
- invalid module exports
- duplicate URL entries

## Example

Example with a runtime that can import the discovered module files:

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
