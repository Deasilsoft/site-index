import { main } from "../../src/main.js";
import { logger } from "../../src/shared/services/logger.service.js";

export async function cli(...args: string[]): Promise<void> {
  const previousExitCode = process.exitCode;
  const previousLoggerError = logger.error;

  let fatalError: string | undefined;

  process.exitCode = undefined;

  try {
    logger.error = (...values: unknown[]) => {
      fatalError = values.map((value) => String(value)).join(" ");
    };

    await main(["node", "site-index", ...args]);

    if (process.exitCode === 1) {
      throw new Error(fatalError ?? "CLI command failed");
    }
  } finally {
    logger.error = previousLoggerError;

    process.exitCode = previousExitCode;
  }
}
