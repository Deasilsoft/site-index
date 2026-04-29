import type { Warning } from "@site-index/core";
import { ZodError } from "zod";

type LoggerOptions = {
  quiet?: boolean;
  verbose?: boolean;
};

class Logger {
  #quiet = false;
  #verbose = false;

  configure(options: LoggerOptions): void {
    this.#quiet = options.quiet === true;
    this.#verbose = options.verbose === true;
  }

  info(message: string): void {
    if (this.#quiet) {
      return;
    }

    this.#write(process.stdout, message);
  }

  warn(input: string | Warning | Warning[]): void {
    if (typeof input === "string") {
      this.#write(process.stderr, `Warning: ${input}`);
      return;
    }

    if (Array.isArray(input)) {
      for (const warning of input) {
        this.#write(process.stderr, this.#formatWarning(warning));
      }
      return;
    }

    this.#write(process.stderr, this.#formatWarning(input));
  }

  error(error: unknown): void {
    this.#write(process.stderr, this.#formatError(error));
  }

  #formatWarning(warning: Warning): string {
    if (warning.filePath === undefined) {
      return `Warning: ${warning.message}`;
    }

    return `Warning: ${warning.message}\n  at ${warning.filePath}`;
  }

  #formatError(error: unknown): string {
    if (error instanceof ZodError) {
      const issues = error.issues.map((issue) => {
        if (issue.path.length === 0) {
          return `- ${issue.message}`;
        }

        return `- ${issue.path.join(".")}: ${issue.message}`;
      });

      return ["Validation error", ...issues].join("\n");
    }

    if (error instanceof Error) {
      if (this.#verbose && error.stack !== undefined) {
        return error.stack;
      }

      return `Error: ${error.message}`;
    }

    return `Error: ${String(error)}`;
  }

  #write(stream: NodeJS.WriteStream, message: string): void {
    if (message.length === 0) {
      return;
    }

    stream.write(`${message}\n`);
  }
}

export const logger = new Logger();
