# @site-index/observability

Observability and logging utilities for site-index packages.

[![npm version](https://img.shields.io/npm/v/@site-index/observability)](https://www.npmjs.com/package/@site-index/observability)
[![Code Quality](https://github.com/Deasilsoft/site-index/actions/workflows/code-quality.yml/badge.svg?branch=main)](https://github.com/Deasilsoft/site-index/actions/workflows/code-quality.yml)
[![Code Coverage](https://codecov.io/gh/Deasilsoft/site-index/graph/badge.svg?flag=@site-index/observability)](https://codecov.io/gh/Deasilsoft/site-index)
[![Socket](https://badge.socket.dev/npm/package/@site-index/observability)](https://socket.dev/npm/package/@site-index/observability)

[Repository README](../../../)

## Install

```bash
npm install @site-index/observability
```

Requirements:

- Node.js `>=22`

## When to use

Use this package when you want consistent warning/error formatting and logging behavior across site-index tooling.

## Public exports

```ts
export { Logger } from "./domains/logger/logger.js";
export type {
  LoggerOptions,
  LogSink,
  LogWriter,
} from "./domains/logger/types.js";
```

## Public API

```ts
class Logger {
  constructor(options?: LoggerOptions);
  configure(options: LoggerOptions): void;
  info(message: string): void;
  warn(input: string | Warning | Warning[]): void;
  error(error: unknown): void;
}
```

Types:

```ts
type LogSink = (message: string) => void;

type LogWriter = {
  info: LogSink;
  warn: LogSink;
  error: LogSink;
};

type LoggerOptions = {
  writer?: LogWriter;
  quiet?: boolean;
  verbose?: boolean;
};
```

## Behavior

- default writers:
  - info -> stdout
  - warn -> stderr
  - error -> stderr
- `quiet` suppresses info logs
- `verbose` includes error stack traces when available
- warning input can be:
  - string
  - single `Warning`
  - `Warning[]`
- warning formatting:
  - `Warning: <message>`
  - `Warning: <filePath>: <message>`
- Zod errors are formatted as validation failures with issue lines

## Example

```ts
import { Logger } from "@site-index/observability";

const logger = new Logger({ verbose: true });

logger.info("Building artifacts");
logger.warn("No site-index modules discovered");
logger.error(new Error("Build failed"));
```

## Related packages

- [`site-index`](../../site-index/)
- [`@site-index/core`](../core/)
- [`@site-index/vite-runtime`](../vite-runtime/)
- [`@site-index/vite-plugin`](../vite-plugin/)
