import { afterEach, describe, expect, it, vi } from "vitest";
import { z as Zod } from "zod";
import { Logger } from "../src/index.js";
import { getFirstMockArgument } from "./helpers/mock.js";

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

  it("formats Zod errors as validation output", () => {
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

    const message = getFirstMockArgument<string>(error, "logger.error");

    expect(message).toContain("Error: Validation failed");
    expect(message).toContain(
      "- siteUrl: Missing required option: --site-url <url>",
    );
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
