import type { Warning } from "@site-index/core";
import { ZodError } from "zod";

type LoggerOptions = {
  quiet?: boolean;
  verbose?: boolean;
};

let quiet = false;
let verbose = false;

function stringify(value: unknown): string {
  return typeof value === "string" ? value : String(value);
}

function stringifyError(error: unknown): string {
  if (error instanceof ZodError) {
    const lines = error.issues.map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";

      return `${path}${issue.message}`;
    });

    return `Validation error:\n- ${lines.join("\n- ")}`;
  }

  if (error instanceof Error) {
    return verbose && error.stack ? error.stack : error.message;
  }

  return String(error);
}

function join(
  values: unknown[],
  formatter: (value: unknown) => string,
): string {
  if (values.length === 0) {
    return "";
  }

  return values.map((value) => formatter(value)).join(" ");
}

function isWarning(value: unknown): value is Warning {
  if (!value || typeof value !== "object") {
    return false;
  }

  if (!("message" in value) || typeof value.message !== "string") {
    return false;
  }

  if (!("filePath" in value)) {
    return true;
  }

  return (
    value.filePath === undefined ||
    typeof (value as { filePath?: unknown }).filePath === "string"
  );
}

export const logger = {
  configure: (options: LoggerOptions) => {
    quiet = options.quiet === true;
    verbose = options.verbose === true;
  },
  info: (...values: unknown[]) => {
    if (quiet) {
      return;
    }

    process.stdout.write(`${join(values, stringify)}\n`);
  },
  warn: (...values: unknown[]) => {
    const nonWarningValues: unknown[] = [];

    for (const value of values) {
      if (isWarning(value)) {
        process.stderr.write(`Warning: ${value.message}\n`);

        if (value.filePath) {
          process.stderr.write(`\tat ${value.filePath}\n`);
        }

        continue;
      }

      nonWarningValues.push(value);
    }

    process.stderr.write(`${join(nonWarningValues, stringify)}\n`);
  },
  error: (...values: unknown[]) => {
    process.stderr.write(`${join(values, stringifyError)}\n`);
  },
};
