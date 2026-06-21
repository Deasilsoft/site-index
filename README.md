# site-index

Deterministic sitemap and robots.txt generation for TypeScript, Vite, and CLI workflows.

`site-index` is a monorepo for deterministic SEO artifact generation from explicit file-based route metadata.

## Why this exists

Most teams eventually hit one or more of these problems:

- manually maintained sitemaps drift from intended public routes
- inconsistent sitemap output between local and CI
- duplicate URLs and invalid metadata slip into production
- no clear place to enforce sitemap/robots validation rules

`site-index` solves this with a file-based indexing model and a deterministic pipeline that works the same way in CLI jobs and Vite-based applications.

## How it works

1. You define route metadata in `*.site-index.*` modules.
2. `site-index` discovers and validates those metadata modules.
3. The pipeline deduplicates, sorts, and generates artifacts.
4. You consume output through the CLI, Vite plugin, or core API.

Generated artifacts:

- `sitemap.xml`
- `sitemap-<name>.xml`
- `robots.txt`

## Deployment patterns

### Static-file hosting

For static Vite deployments, `@site-index/vite-plugin` is usually enough.

- in `vite dev`, it serves generated artifacts for local verification
- in `vite build`, it emits generated artifacts as build assets

### SSR hosting

For SSR deployments, the Vite plugin is still useful for dev/build parity, but many teams also run the `site-index` CLI after deployment when sitemap-worthy metadata changes.

Common patterns:

- on-demand operational tasks
- CI/CD post-deploy steps
- scheduled jobs (for example, every 10 minutes on frequently changing sites)

Cadence is deployment-specific and depends on how often public route metadata changes, how artifacts are served, and the hosting model.

When using the CLI after deployment, write artifacts to the directory, volume, object store, or public asset location your host actually serves.

### Custom integrations

Use `@site-index/core` (optionally with `@site-index/vite-runtime`) when you need custom module loading, runtime wiring, or hosting integration beyond standard CLI/Vite flows.

## Package map

| Package                     | What problem it solves                                                                            | Best for                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `site-index`                | CLI workflows for scaffolding, validating, and generating sitemap/robots artifacts.               | CI pipelines, scripts, scheduled jobs, and SSR post-deploy regeneration |
| `@site-index/vite-plugin`   | Integrates generation into Vite lifecycle, serving artifacts in `vite dev` and emitting in build. | Vite apps where dev/build generation matches deployment needs           |
| `@site-index/core`          | Framework-agnostic deterministic pipeline and validation engine.                                  | Custom integrations and programmatic control                            |
| `@site-index/vite-runtime`  | Vite-backed execution/runtime layer used by plugin and CLI integration paths.                     | Integration authors who need runtime control                            |
| `@site-index/observability` | Consistent warnings/errors formatting and logger behavior.                                        | Shared observability across packages                                    |

## Choose your entry point

- Use [`packages/@site-index/vite-plugin`](packages/@site-index/vite-plugin/) for Vite apps when dev/build artifact generation fits your deployment model.
- Use [`packages/site-index`](packages/site-index/) for CI, scripts, and SSR deployments that need post-deploy regeneration.
- Use [`packages/@site-index/core`](packages/@site-index/core/) and [`packages/@site-index/vite-runtime`](packages/@site-index/vite-runtime/) for custom integrations.

## Quickstart (CLI)

```bash
npm install -D site-index
npx site-index make src/pages.site-index.ts --format ts
npx site-index build --site-url https://example.com
npx site-index check --site-url https://example.com
```

## Public API imports

```ts
import { main } from "@site-index/core";
import { siteIndexPlugin } from "@site-index/vite-plugin";
```

## Shared module model

Discovered files:

- `**/*.site-index.js`
- `**/*.site-index.mjs`
- `**/*.site-index.ts`

Default supported module extensions:

- `.js`
- `.mjs`
- `.ts`

Default ignored paths:

- `**/node_modules/**`
- `**/dist/**`
- `**/coverage/**`
- `**/.git/**`

TypeScript module example:

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

JavaScript module example:

```js
/** @type {import("@site-index/core").SiteIndex[]} */
const siteIndexes = [{ url: "/" }];

export default { siteIndexes };
```

## Monorepo development

Requirements:

- Node.js `>=22`
- npm workspaces

Install dependencies:

```bash
npm install
```

Run CI-equivalent checks locally:

```bash
npm run format:check
npm run lint
npm run knip
npm run typecheck
npm test
```

Local package-build validation:

```bash
npm run build
```

Run CLI from repo root:

```bash
npm run cli -- build --site-url https://example.com
```

## Related docs

- [`packages/site-index/README.md`](packages/site-index/README.md)
- [`packages/@site-index/vite-plugin/README.md`](packages/@site-index/vite-plugin/README.md)
- [`packages/@site-index/core/README.md`](packages/@site-index/core/README.md)
- [`packages/@site-index/vite-runtime/README.md`](packages/@site-index/vite-runtime/README.md)
- [`packages/@site-index/observability/README.md`](packages/@site-index/observability/README.md)
- [`CONTRIBUTING.md`](CONTRIBUTING.md)

## License

MIT
