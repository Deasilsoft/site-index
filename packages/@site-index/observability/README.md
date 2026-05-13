# @site-index/observability

Observability and logging utilities for site-index packages.

[Repository README](../../../README.md)

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

- [`site-index`](../../site-index/README.md)
- [`@site-index/core`](../core/README.md)
- [`@site-index/vite-runtime`](../vite-runtime/README.md)
- [`@site-index/vite-plugin`](../vite-plugin/README.md)
