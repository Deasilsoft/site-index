# site-index

Deterministic sitemap and robots.txt generation for TypeScript, Vite, and CLI workflows.

`site-index` is a monorepo for deterministic SEO artifact generation from explicit file-based route metadata.

Define route metadata in `*.site-index.*` modules, then generate deterministic `sitemap.xml`, segmented sitemaps, and `robots.txt` through the CLI, Vite plugin, or core runtime APIs.

## Deployment patterns

### Static-file hosting

For static Vite deployments, use `@site-index/vite-plugin` to serve artifacts during `vite dev` and emit them during `vite build`.

### SSR hosting

For SSR deployments, keep the Vite plugin for dev/build parity and run `site-index` after deploy when sitemap-worthy metadata changes. Regeneration can run on demand, in CI/CD, or on a schedule.

A 10-minute cron is a practical example for frequently changing sites, not a default. Choose cadence based on metadata change frequency, serving path, and hosting model, and write output to the directory, volume, object store, or public asset location your host serves.

### Custom integrations

Use `@site-index/core` (optionally with `@site-index/vite-runtime`) when you need custom module loading, runtime wiring, or hosting integration beyond standard CLI/Vite flows.

## Package map

| Package                     | Role                                                             | Best for                                 |
| --------------------------- | ---------------------------------------------------------------- | ---------------------------------------- |
| `site-index`                | CLI for scaffolding, validation, and artifact generation         | CI, scripts, schedules, SSR regeneration |
| `@site-index/vite-plugin`   | Vite integration that serves in dev and emits in build           | Vite apps with build-time artifacts      |
| `@site-index/core`          | Framework-agnostic deterministic pipeline                        | Custom integrations                      |
| `@site-index/vite-runtime`  | Vite-backed runtime adapter used by CLI/plugin integration paths | Runtime-level integrations               |
| `@site-index/observability` | Shared warning/error formatting and logger behavior              | Shared diagnostics                       |

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
