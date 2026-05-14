# site-index

Deterministic sitemap and robots.txt generation for TypeScript, Vite, and CLI workflows.

`site-index` is an npm workspaces monorepo for generating SEO artifacts from file-based site indexing modules. It gives you one shared content model and consistent outputs across CLI and Vite integrations.

Use it to keep sitemap generation and robots.txt generation deterministic across local development, CI, and build pipelines.

## What problem it solves

Maintaining `sitemap.xml`, segmented sitemaps, and `robots.txt` manually is error-prone as sites grow.

`site-index` provides:

- file-based site indexing via `*.site-index.*` modules
- deterministic generation of sitemap and robots.txt artifacts
- validation and deduplication in a shared core pipeline
- both CLI and Vite plugin workflows for static sites and web apps

## Package map

| Package                     | Role                                                                                                                  | Best for                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `site-index`                | CLI for creating site-index modules and generating/checking sitemap + robots.txt artifacts.                           | CI pipelines and terminal-driven workflows              |
| `@site-index/vite-plugin`   | Vite plugin for serving generated artifacts in dev and emitting them during build.                                    | Vite apps                                               |
| `@site-index/core`          | Deterministic framework-agnostic pipeline for discovery, loading, validation, deduplication, and artifact generation. | Custom integrations and programmatic usage              |
| `@site-index/vite-runtime`  | Vite-backed runtime for executing the core pipeline through Vite module loading.                                      | Integration authors who need direct runtime control     |
| `@site-index/observability` | Shared logging and observability utilities used by the packages.                                                      | Consistent logging/formatting across site-index tooling |

## Package documentation

- [`packages/site-index`](packages/site-index/)
- [`packages/@site-index/vite-plugin`](packages/@site-index/vite-plugin/)
- [`packages/@site-index/core`](packages/@site-index/core/)
- [`packages/@site-index/vite-runtime`](packages/@site-index/vite-runtime/)
- [`packages/@site-index/observability`](packages/@site-index/observability/)

## Shared content model (high-level)

Discovered files:

- `**/*.site-index.js`
- `**/*.site-index.mjs`
- `**/*.site-index.ts`

Default ignored paths:

- `**/node_modules/**`
- `**/dist/**`
- `**/coverage/**`
- `**/.git/**`

Default supported extensions:

```ts
[".js", ".mjs", ".ts"];
```

TypeScript module shape:

```ts
import type { SiteIndex } from "@site-index/core";

const siteIndexes = [
  {
    url: "/",
    lastModified: "2026-04-01T00:00:00.000Z",
  },
] satisfies SiteIndex[];

export default { siteIndexes };
```

ESM/JavaScript module shape:

```js
/** @type {import("@site-index/core").SiteIndex[]} */
const siteIndexes = [
  {
    url: "/",
    lastModified: "2026-04-01T00:00:00.000Z",
  },
];

export default { siteIndexes };
```

Generated artifacts:

- `sitemap.xml`
- `sitemap-<name>.xml`
- `robots.txt`

For exact validation and pipeline details, see [`packages/@site-index/core`](packages/@site-index/core/).

## Monorepo development

Requirements:

- Node.js `>=22`
- npm workspaces

Install dependencies for general local development:

```bash
npm install
```

For contribution checks that should match CI more closely, use `npm ci` as
documented in [`CONTRIBUTING.md`](CONTRIBUTING.md).

Run from repository root:

```bash
npm run build
npm run format
npm run format:check
npm run lint
npm run lint:fix
npm run typecheck
npm run test
npm run knip
npm run clean
```

Run the CLI workspace from the monorepo:

```bash
npm run cli -- build --site-url https://example.com
```

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for process, standards, and testing
expectations.

## License

MIT
