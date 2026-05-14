# @site-index/vite-runtime

Vite-backed runtime for executing site-index pipelines through Vite SSR module loading.

[![npm version](https://img.shields.io/npm/v/%40site-index%2Fvite-runtime)](https://www.npmjs.com/package/%40site-index%2Fvite-runtime)
[![Code Quality](https://github.com/Deasilsoft/site-index/actions/workflows/code-quality.yml/badge.svg?branch=main)](https://github.com/Deasilsoft/site-index/actions/workflows/code-quality.yml)
[![Code Coverage](https://codecov.io/gh/Deasilsoft/site-index/graph/badge.svg?flag=%40site-index%2Fvite-runtime)](https://codecov.io/gh/Deasilsoft/site-index)
[![Socket](https://badge.socket.dev/npm/package/%40site-index%2Fvite-runtime)](https://socket.dev/npm/package/%40site-index%2Fvite-runtime)

[Repository README](../../../)

## Install

```bash
npm install @site-index/vite-runtime
```

Requirements:

- Node.js `>=22`
- peer dependency: `vite ^8.0.10`

## When to use

Use this package when building adapters or integrations that need direct Vite-backed pipeline execution.

## When not to use

- Most users should use [`site-index`](../../site-index/) or [`@site-index/vite-plugin`](../vite-plugin/) directly.

## Public exports

```ts
export { createRuntimeService } from "./domains/runtime/factory.js";
export { RuntimeServiceBuilder } from "./domains/runtime/builder.js";
export { RuntimeService } from "./domains/runtime/service.js";
export type { Options, RuntimeViteConfig } from "./types.js";
```

## Public API

Factory:

```ts
createRuntimeService(): RuntimeServiceBuilder
```

Builder:

```ts
class RuntimeServiceBuilder {
  withOptions(options: Options): this;
  withViteConfig(config: RuntimeViteConfig): this;
  withViteServer(server: Vite.ViteDevServer): this;
  build(): RuntimeService;
}
```

Runtime service:

```ts
class RuntimeService {
  buildArtifacts(): Promise<SiteIndex.Result<SiteIndex.Artifact[]>>;
  getArtifacts(): readonly SiteIndex.Artifact[];
  getWatchedFiles(): ReadonlySet<string>;
  close(): Promise<void>;
}
```

Options:

```ts
type Options = Pick<SiteIndex.Options, "siteUrl" | "extensions">;
```

Runtime Vite config:

```ts
type RuntimeViteConfig = {
  root: Vite.ResolvedConfig["root"];
  mode: Vite.ResolvedConfig["mode"];
  configFile?: Vite.ResolvedConfig["configFile"];
};
```

## Behavior

- uses Vite SSR loading for executing discovered site-index modules
- can run with an existing Vite dev server
- can create its own middleware-mode Vite server from config
- tracks watched files through Vite's SSR module graph
- serializes `buildArtifacts()` calls through an internal queue
- snapshots latest artifacts and watched files
- clears snapshots and closes internally created server resources on `close()`
- does not close externally provided Vite dev servers

## Example

```ts
import { createRuntimeService } from "@site-index/vite-runtime";

const runtime = createRuntimeService()
  .withOptions({
    siteUrl: "https://example.com",
  })
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

## Related packages

- [`@site-index/core`](../core/)
- [`@site-index/vite-plugin`](../vite-plugin/)
- [`site-index`](../../site-index/)
