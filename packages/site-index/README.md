# site-index

CLI for creating site-index modules and generating/checking sitemap and robots.txt artifacts.

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

## When to use

Use `site-index` when you want command-line workflows for:

- scaffolding `*.site-index.*` modules
- generating sitemap and robots.txt artifacts
- validating site-index modules in CI

## When not to use

- Use [`@site-index/vite-plugin`](../@site-index/vite-plugin/) for Vite-native integration.
- Use [`@site-index/core`](../@site-index/core/) for custom programmatic pipelines.

## Global options

- `--quiet`: suppress informational output
- `--verbose`: enable verbose logging

## Commands

### `make`

```bash
site-index make <filePath> [--format <format>] [--force]
```

Behavior:

- creates a new site-index module template
- supports `--format ts`
- supports `--format esm`
- defaults format to `ts`
- refuses to overwrite existing files unless `--force` is used
- normalizes output filenames to:
  - `<name>.site-index.ts`
  - `<name>.site-index.mjs`

### `build`

```bash
site-index build --site-url <url> [--root <path>] [--out <dir>] [--config <path>]
```

Behavior:

- generates site-index artifacts
- writes artifacts to `--out` (default: `dist`)
- requires `--site-url`
- validates `--site-url` as a valid URL
- validates `--out` resolves within `--root`
- uses Vite config when `--config` is provided
- `--root` defaults to current working directory
- `--config` must resolve within `--root`

### `check`

```bash
site-index check --site-url <url> [--root <path>] [--config <path>]
```

Behavior:

- validates discovered site-index modules for CI
- requires `--site-url`
- fails when warnings are produced
- uses Vite config when `--config` is provided
- `--root` defaults to current working directory
- `--config` must resolve within `--root`

## Examples

```bash
npx site-index make src/pages.site-index.ts --format ts
npx site-index make src/pages.site-index.mjs --format esm
npx site-index build --site-url https://example.com
npx site-index check --site-url https://example.com
```

Local monorepo development:

```bash
npm run cli -- build --site-url https://example.com
```

## How it fits in the monorepo

`site-index` is the user-facing CLI package built on:

- [`@site-index/vite-runtime`](../@site-index/vite-runtime/)
- [`@site-index/core`](../@site-index/core/)
- [`@site-index/observability`](../@site-index/observability/)
