# site-index

CLI for generating deterministic sitemap and robots.txt artifacts from file-based route metadata.

[![npm version](https://img.shields.io/npm/v/site-index)](https://www.npmjs.com/package/site-index)
[![Code Quality](https://github.com/Deasilsoft/site-index/actions/workflows/code-quality.yml/badge.svg?branch=main)](https://github.com/Deasilsoft/site-index/actions/workflows/code-quality.yml)
[![Code Coverage](https://codecov.io/gh/Deasilsoft/site-index/graph/badge.svg?flag=site-index)](https://codecov.io/gh/Deasilsoft/site-index)
[![Socket](https://badge.socket.dev/npm/package/site-index)](https://socket.dev/npm/package/site-index)

[Repository README](../../)

## Install

```bash
npm install -D site-index
```

Requirements:

- Node.js `>=22`

## Typical workflow

1. Scaffold a `*.site-index.*` module with `make`.
2. Add route metadata (`url`, optional `lastModified`, etc.).
3. Run `build` to generate sitemap/robots artifacts.
4. Run `check` in CI to fail on warnings.

## SSR/post-deploy regeneration

For SSR deployments, `site-index build` can run after deployment from an on-demand task, CI/CD step, or scheduled job. A 10-minute cron can be practical for frequently changing sites, but it is not a default cadence. Write output to the directory, volume, object store, or public asset location your platform serves.

## Global options

- `--quiet`: suppress informational output
- `--verbose`: include stack traces when available

## Commands

### `make`

```bash
site-index make <filePath> [--format <format>] [--force]
```

Use this to scaffold route metadata modules.

- `--format ts` generates TypeScript
- `--format esm` generates JavaScript ESM
- default format is `ts`
- output is normalized to:
  - `<name>.site-index.ts`
  - `<name>.site-index.mjs`
- existing files are protected unless `--force` is used

### `build`

```bash
site-index build --site-url <url> [--root <path>] [--out <dir>] [--config <path>]
```

Use this to generate SEO artifacts for deployment.

- generates `sitemap.xml`, segmented sitemaps, and `robots.txt`
- writes to `--out` (default: `dist`)
- validates `--site-url` as HTTP(S) origin
- validates path safety (`--out` and `--config` within `--root`)
- uses Vite config when `--config` is provided

### `check`

```bash
site-index check --site-url <url> [--root <path>] [--config <path>]
```

Use this for CI quality gates.

- validates discovered modules and metadata
- fails on warnings to prevent bad SEO outputs
- uses the same core pipeline as `build`

## Examples

```bash
npx site-index make src/pages.site-index.ts --format ts
npx site-index make src/pages.site-index.mjs --format esm
npx site-index build --site-url https://example.com
npx site-index check --site-url https://example.com
```

Monorepo local run:

```bash
npm run cli -- build --site-url https://example.com
```

## Package architecture

This CLI is built on:

- [`@site-index/vite-runtime`](../@site-index/vite-runtime/)
- [`@site-index/core`](../@site-index/core/)
- [`@site-index/observability`](../@site-index/observability/)

If you already use Vite app config directly, consider [`@site-index/vite-plugin`](../@site-index/vite-plugin/).
