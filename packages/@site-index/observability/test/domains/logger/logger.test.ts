import { afterEach, describe, expect, it, vi } from "vitest";
import { z as Zod } from "zod";
import { Logger } from "../../../src/index.js";

function getFirstLoggedMessage(
  sink: ReturnType<typeof vi.fn>,
  label: string,
): string {
  const firstCall = sink.mock.calls[0];

  if (firstCall === undefined) {
    throw new Error(`Expected ${label} to be called`);
  }

  const firstArgument = firstCall[0];

  if (typeof firstArgument !== "string") {
    throw new TypeError(`Expected ${label} first argument to be a string`);
  }

  return firstArgument;
}

describe("Logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes info/warn/error through the configured writer", () => {
    const info = vi.fn();
    const warn = vi.fn();
    const error = vi.fn();
    const logger = new Logger({ writer: { info, warn, error } });

    logger.info("info");
    logger.warn("warn");
    logger.error("boom");

    expect(info).toHaveBeenCalledWith("info");
    expect(warn).toHaveBeenCalledWith("Warning: warn");
    expect(error).toHaveBeenCalledWith("Error: boom");
  });

  it("does not write empty info messages", () => {
    const info = vi.fn();
    const logger = new Logger({
      writer: {
        info,
        warn: vi.fn(),
        error: vi.fn(),
      },
    });

    logger.info("");

    expect(info).not.toHaveBeenCalled();
  });

  it("suppresses info when quiet is enabled", () => {
    const info = vi.fn();
    const warn = vi.fn();
    const error = vi.fn();
    const logger = new Logger({ writer: { info, warn, error }, quiet: true });

    logger.info("info");
    logger.warn("warn");
    logger.error("boom");

    expect(info).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith("Warning: warn");
    expect(error).toHaveBeenCalledWith("Error: boom");
  });

  it("preserves quiet when enabling verbose through a partial configure call", () => {
    const writer = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const logger = new Logger({ writer, quiet: true });
    const error = new Error("boom");

    error.stack = "STACK_TRACE";

    logger.configure({ verbose: true });

    logger.info("still-hidden");
    logger.error(error);

    expect(writer.info).not.toHaveBeenCalled();
    expect(writer.error).toHaveBeenCalledWith("STACK_TRACE");
  });

  it("preserves the configured writer across partial configure calls", () => {
    const writer = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const logger = new Logger({ writer });

    logger.configure({ quiet: true });
    logger.configure({ quiet: false });

    logger.warn("warn");
    logger.error(new Error("boom"));

    expect(writer.warn).toHaveBeenCalledWith("Warning: warn");
    expect(writer.error).toHaveBeenCalledWith("Error: boom");
  });

  it("uses the replacement writer after configuring writer", () => {
    const writerOne = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const writerTwo = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const logger = new Logger({ writer: writerOne });

    logger.info("first");

    logger.configure({ writer: writerTwo });
    logger.info("second");

    expect(writerOne.info).toHaveBeenCalledTimes(1);
    expect(writerOne.info).toHaveBeenCalledWith("first");
    expect(writerTwo.info).toHaveBeenCalledWith("second");
  });

  it("formats warning objects and arrays, including optional filePath", () => {
    const warn = vi.fn();
    const logger = new Logger({
      writer: { info: vi.fn(), warn, error: vi.fn() },
    });

    logger.warn({ message: "A", filePath: "src/a.ts" });
    logger.warn([{ message: "B" }, { message: "C", filePath: "src/c.ts" }]);

    expect(warn).toHaveBeenNthCalledWith(1, "Warning: src/a.ts: A");
    expect(warn).toHaveBeenNthCalledWith(2, "Warning: B");
    expect(warn).toHaveBeenNthCalledWith(3, "Warning: src/c.ts: C");
  });

  it("formats Zod errors for field-level validation issues", () => {
    const error = vi.fn();
    const logger = new Logger({
      writer: { info: vi.fn(), warn: vi.fn(), error },
    });

    const schema = Zod.object({
      siteUrl: Zod.string({
        error: "Missing required option: --site-url <url>",
      }),
    });

    try {
      schema.parse({});
    } catch (error_) {
      logger.error(error_);
    }

    const message = getFirstLoggedMessage(error, "logger.error");

    expect(message).toContain("Error: Validation failed");
    expect(message).toContain(
      "- siteUrl: Missing required option: --site-url <url>",
    );
  });

  it("formats Zod errors for root-level issues with an empty issue path", () => {
    const error = vi.fn();
    const logger = new Logger({
      writer: { info: vi.fn(), warn: vi.fn(), error },
    });

    const schema = Zod.string().superRefine((_value, context) => {
      context.addIssue({
        code: "custom",
        message: "Root-level validation issue",
      });
    });

    try {
      schema.parse("ok");
    } catch (error_) {
      logger.error(error_);
    }

    const message = getFirstLoggedMessage(error, "logger.error");

    expect(message).toContain("Error: Validation failed");
    expect(message).toContain("- Root-level validation issue");
  });

  it("includes stack traces in verbose mode", () => {
    const errorSink = vi.fn();
    const logger = new Logger({
      writer: { info: vi.fn(), warn: vi.fn(), error: errorSink },
    });

    const error = new Error("boom");

    error.stack = "STACK_TRACE";

    logger.error(error);
    logger.configure({ verbose: true });
    logger.error(error);

    expect(errorSink).toHaveBeenNthCalledWith(1, "Error: boom");
    expect(errorSink).toHaveBeenNthCalledWith(2, "STACK_TRACE");
  });

  it("formats non-Error values passed to logger.error", () => {
    const errorSink = vi.fn();
    const logger = new Logger({
      writer: { info: vi.fn(), warn: vi.fn(), error: errorSink },
    });

    logger.error(42);
    logger.error({ reason: "boom" });

    expect(errorSink).toHaveBeenNthCalledWith(1, "Error: 42");
    expect(errorSink).toHaveBeenNthCalledWith(2, "Error: [object Object]");
  });

  it("writes default output with newline delimiters", () => {
    const stdout = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);

    const stderr = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);

    const logger = new Logger();

    logger.info("info");
    logger.warn("warn");
    logger.error(new Error("boom"));

    expect(stdout).toHaveBeenCalledWith("info\n");
    expect(stderr).toHaveBeenCalledWith("Warning: warn\n");
    expect(stderr).toHaveBeenCalledWith("Error: boom\n");
  });
});
