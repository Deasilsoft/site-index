# Official site-index packages

Generate deterministic sitemaps and robots.txt from code or data.

Define your site structure once using `*.site-index.*` modules, and generate identical artifacts across build tools, CLI workflows, and programmatic integrations.

The system is split into three focused packages:

- `site-index`: core pipeline library (framework-agnostic)
- `site-index-cli`: CLI wrapper for Node/CI/cron usage
- `vite-plugin-site-index`: Vite integration built on top of `site-index`

All packages share the same module contract and produce the same output artifacts.

## Package map

| Package                  | Purpose                                        | Best for                                                   |
| ------------------------ | ---------------------------------------------- | ---------------------------------------------------------- |
| `site-index`             | Discovery, validation, and artifact generation | Programmatic integration in any Node app                   |
| `site-index-cli`         | Run the pipeline from terminal/CI/cron         | Scheduled jobs, static generation without custom glue code |
| `vite-plugin-site-index` | Vite build + dev integration                   | Vite apps that want sitemap + robots automatically         |

## Install

Install based on your use case:

**Vite app**

```bash
npm install -D vite-plugin-site-index
```

**CLI / CI / cron**

```bash
npm install -D site-index-cli
```

**Programmatic usage**

```bash
npm install site-index
```

## Shared content model (`*.site-index.*`)

Each module must export a default array:

```ts
import type { SiteIndex } from "site-index";

export default [
  { url: "/" },
  { url: "/about" },
  { url: "/blog/first-post", sitemap: "blog" },
  { url: "/admin", index: false },
] satisfies SiteIndex[];
```

Dynamic data is supported:

```ts
import type { SiteIndex } from "site-index";

const rows = [{ slug: "first-post", updatedAt: "2026-04-01T00:00:00.000Z" }];

export default rows.map((row) => ({
  url: `/blog/${row.slug}`,
  sitemap: "blog",
  lastModified: row.updatedAt,
})) satisfies SiteIndex[];
```

## Output artifacts

All packages produce the same artifact set:

- `sitemap.xml` (index)
- `sitemap-<name>.xml`
- `robots.txt`

## Flow 1: Vite plugin (`vite-plugin-site-index`)

```ts
import { defineConfig } from "vite";
import { siteIndexPlugin } from "vite-plugin-site-index";

export default defineConfig({
  plugins: [
    siteIndexPlugin({
      siteUrl: "https://example.com",
    }),
  ],
});
```

Behavior:

- `vite build` emits artifacts into the output bundle
- `vite dev` serves up-to-date artifacts:
  - `/sitemap.xml`
  - `/sitemap-<name>.xml`
  - `/robots.txt`

## Flow 2: CLI (`site-index-cli`)

For CI, cron jobs, or manual builds.

```bash
npx site-index build --site-url https://example.com --root .
```

## Flow 3: Core library (`site-index`)

```ts
import { runSiteIndexPipeline } from "site-index";

const result = await runSiteIndexPipeline({
  siteUrl: "https://example.com",
  discoveryRoot: process.cwd(),
  loadDiscoveredModules: async (modules) => {
    const data = await Promise.all(
      modules.map(async (module) => ({
        module,
        exports: (await import(module.filePath)) as { default: unknown[] },
      })),
    );

    return { data, warnings: [] };
  },
});
```

## Constraints

- Requires Node.js
- Uses file-based discovery via `*.site-index.*` modules
- Module loading relies on runtime execution (e.g. Vite SSR or native import)

## Workspace development

This repository is an npm workspaces monorepo (`packages/*`).

```bash
npm install
npm run build
npm run typecheck
npm run lint
npm run test
```

Per-package scripts are available under each `packages/*/package.json`.
