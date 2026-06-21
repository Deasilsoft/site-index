import type { Warning } from "@site-index/core";
import { formatError, formatWarning } from "./format.js";
import type { LoggerOptions, LogSink, LogWriter } from "./types.js";
import { defaultLogWriter } from "./writer.js";

export class Logger {
  #writer: LogWriter = defaultLogWriter;
  #quiet = false;
  #verbose = false;

  constructor(options?: LoggerOptions) {
    if (options !== undefined) {
      this.configure(options);
    }
  }

  #write(write: LogSink, message: string): void {
    if (message.length === 0) {
      return;
    }

    write(message);
  }

  configure(options: LoggerOptions): void {
    if (options.writer !== undefined) {
      this.#writer = options.writer;
    }

    if (options.quiet !== undefined) {
      this.#quiet = options.quiet;
    }

    if (options.verbose !== undefined) {
      this.#verbose = options.verbose;
    }
  }

  info(message: string): void {
    if (this.#quiet) {
      return;
    }

    this.#write(this.#writer.info, message);
  }

  warn(input: string | Warning | Warning[]): void {
    if (typeof input === "string") {
      this.#write(this.#writer.warn, `Warning: ${input}`);
      return;
    }

    if (Array.isArray(input)) {
      for (const warning of input) {
        this.#write(this.#writer.warn, formatWarning(warning));
      }
      return;
    }

    this.#write(this.#writer.warn, formatWarning(input));
  }

  error(error: unknown): void {
    this.#write(this.#writer.error, formatError(error, this.#verbose));
  }
}
