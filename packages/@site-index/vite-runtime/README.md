# @site-index/vite-runtime

Vite-powered runtime for executing the site-index core pipeline with SSR module loading.

[![npm version](https://img.shields.io/npm/v/@site-index/vite-runtime)](https://www.npmjs.com/package/@site-index/vite-runtime)
[![Code Quality](https://github.com/Deasilsoft/site-index/actions/workflows/code-quality.yml/badge.svg?branch=main)](https://github.com/Deasilsoft/site-index/actions/workflows/code-quality.yml)
[![Code Coverage](https://codecov.io/gh/Deasilsoft/site-index/graph/badge.svg?flag=@site-index/vite-runtime)](https://codecov.io/gh/Deasilsoft/site-index)
[![Socket](https://badge.socket.dev/npm/package/@site-index/vite-runtime)](https://socket.dev/npm/package/@site-index/vite-runtime)

[Repository README](../../../)

## What problem this package solves

`@site-index/core` is framework-agnostic by design, which means integrations must provide module loading and runtime orchestration.

`@site-index/vite-runtime` solves that integration layer for Vite ecosystems by:

- loading route modules via Vite SSR APIs
- tracking dependency graph watched files
- serializing rebuild work for stable output snapshots
- handling runtime lifecycle and cleanup

Use this package when you are building your own adapter around Vite runtime internals.

## Install

```bash
npm install @site-index/vite-runtime
```

Requirements:

- Node.js `>=22`
- peer dependency: `vite ^8.0.10`

## Public API

```ts
createRuntimeService(): RuntimeServiceBuilder
```

```ts
class RuntimeServiceBuilder {
  withOptions(options: Options): this;
  withViteConfig(config: RuntimeViteConfig): this;
  withViteServer(server: Vite.ViteDevServer): this;
  build(): RuntimeService;
}
```

```ts
class RuntimeService {
  buildArtifacts(): Promise<SiteIndex.Result<readonly SiteIndex.Artifact[]>>;
  getArtifacts(): readonly SiteIndex.Artifact[];
  getWatchedFiles(): ReadonlySet<string>;
  close(): Promise<void>;
}
```

```ts
type Options = Pick<SiteIndex.Options, "siteUrl" | "extensions">;
```

```ts
type RuntimeViteConfig = {
  root: Vite.ResolvedConfig["root"];
  mode: Vite.ResolvedConfig["mode"];
  configFile?: Vite.ResolvedConfig["configFile"];
};
```

## Runtime behavior

- executes discovered site-index modules with Vite SSR loading
- supports two integration modes:
  - use an existing Vite dev server
  - create an internal middleware-mode server from Vite config
- tracks watched files from Vite module graph
- serializes `buildArtifacts()` via an internal queue
- stores artifact and watched-file snapshots
- `close()` clears snapshots and only closes internally-created servers

## Example

```ts
import { createRuntimeService } from "@site-index/vite-runtime";

const runtime = createRuntimeService()
  .withOptions({ siteUrl: "https://example.com" })
  .withViteConfig({
    root: process.cwd(),
    mode: "production",
  })
  .build();

try {
  const result = await runtime.buildArtifacts();
  // use result.data and result.warnings
} finally {
  await runtime.close();
}
```

## When not to use this directly

- Use [`@site-index/vite-plugin`](../vite-plugin/) for standard Vite app integration.
- Use [`site-index`](../../site-index/) for CLI workflows.

## Related packages

- [`@site-index/core`](../core/)
- [`@site-index/vite-plugin`](../vite-plugin/)
- [`site-index`](../../site-index/)
