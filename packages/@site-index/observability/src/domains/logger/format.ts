import type { Warning } from "@site-index/core";
import { ZodError } from "zod";

export function formatWarning(warning: Warning): string {
  if (warning.filePath === undefined) {
    return `Warning: ${warning.message}`;
  }

  return `Warning: ${warning.filePath}: ${warning.message}`;
}

export function formatError(error: unknown, isVerbose: boolean): string {
  if (error instanceof ZodError) {
    const issues = error.issues.map((issue) => {
      if (issue.path.length === 0) {
        return `- ${issue.message}`;
      }

      return `- ${issue.path.join(".")}: ${issue.message}`;
    });

    return ["Error: Validation failed", ...issues].join("\n");
  }

  if (error instanceof Error) {
    if (isVerbose && error.stack !== undefined) {
      return error.stack;
    }

    return `Error: ${error.message}`;
  }

  return `Error: ${String(error)}`;
}
