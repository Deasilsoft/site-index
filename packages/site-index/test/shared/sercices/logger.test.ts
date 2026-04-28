import { afterEach, describe, expect, it } from "vitest";
import { z as Zod } from "zod";
import { logger } from "../../../src/shared/services/logger.service.js";
import { captureStreams } from "../../helpers/streams.js";

describe("logger", () => {
  afterEach(() => {
    logger.configure({ quiet: false, verbose: false });
  });

  it("suppresses informational output when quiet is enabled", () => {
    logger.configure({ quiet: true, verbose: false });
    const output = captureStreams();

    try {
      logger.info("info message");
      logger.warn("warn message");
      logger.error("error message");
    } finally {
      output.restore();
      logger.configure({ quiet: false, verbose: false });
    }

    expect(output.stdout()).toBe("");
    expect(output.stderr()).toContain("warn message");
    expect(output.stderr()).toContain("error message");
  });

  it("formats Zod validation errors for readability", () => {
    const schema = Zod.object({
      siteUrl: Zod.string({
        error: "Missing required option: --site-url <url>",
      }),
      format: Zod.enum(["ts", "esm"], {
        error: "Invalid option: --format must be one of: ts, esm",
      }),
    });

    const output = captureStreams();

    try {
      try {
        schema.parse({ format: "cjs" });
      } catch (error) {
        logger.error(error);
      }
    } finally {
      output.restore();
    }

    const stderr = output.stderr();
    expect(stderr).toContain("Validation error:");
    expect(stderr).toContain(
      "siteUrl: Missing required option: --site-url <url>",
    );
    expect(stderr).toContain(
      "format: Invalid option: --format must be one of: ts, esm",
    );
  });

  it("reports Error.message by default and stack in verbose mode", () => {
    const error = new Error("boom");
    error.stack = "STACK_TRACE";

    const output = captureStreams();

    try {
      logger.configure({ quiet: false, verbose: false });
      logger.error(error);

      logger.configure({ quiet: false, verbose: true });
      logger.error(error);
    } finally {
      output.restore();
      logger.configure({ quiet: false, verbose: false });
    }

    const stderr = output.stderr();
    expect(stderr).toContain("boom");
    expect(stderr).toContain("STACK_TRACE");
  });

  it("stringifies non-Error throws", () => {
    const output = captureStreams();

    try {
      logger.error({ reason: "not an Error instance" });
    } finally {
      output.restore();
    }

    expect(output.stderr()).toContain("[object Object]");
  });

  it("prints warnings with location context", () => {
    const output = captureStreams();

    try {
      logger.warn({ message: "Missing alternate", filePath: "src/a.ts" });
      logger.warn({ message: "Missing robots" });
    } finally {
      output.restore();
    }

    const stderr = output.stderr();
    expect(stderr).toContain("Warning: Missing alternate");
    expect(stderr).toContain("\tat src/a.ts");
    expect(stderr).toContain("Warning: Missing robots");
  });
});
