# @site-index/observability

Shared logging and error-formatting utilities for site-index packages.

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

- default sinks: `info` -> stdout, `warn`/`error` -> stderr
- `quiet` suppresses info output
- `verbose` includes stack traces when available
- warning inputs: string, `Warning`, or `Warning[]`
- warning format: `Warning: <message>` or `Warning: <filePath>: <message>`
- Zod errors are formatted as validation summaries with issue lines

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
