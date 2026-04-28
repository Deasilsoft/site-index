import { afterEach, describe, expect, it, vi } from "vitest";
import { main } from "../src/main.js";
import {
  type MainTestMocks,
  resetMainTestMocks,
  setRunMatchedCommandImpl,
} from "./helpers/main.js";

const mainTestMocks = vi.hoisted<MainTestMocks>(() => {
  const cli = {
    option: vi.fn(),
    version: vi.fn(),
    help: vi.fn(),
    outputHelp: vi.fn(),
    parse: vi.fn((argv: string[]) => ({
      options: {
        quiet: argv.includes("--quiet"),
        verbose: argv.includes("--verbose"),
      },
    })),
    runMatchedCommand: vi.fn(async () => {}),
  };

  return {
    cli,
    cacMock: vi.fn().mockReturnValue(cli),
    initBuildCommand: vi.fn(),
    initCheckCommand: vi.fn(),
    initMakeCommand: vi.fn(),
    configureLogger: vi.fn(),
    loggerError: vi.fn(),
  };
});

vi.mock("cac", () => ({ cac: mainTestMocks.cacMock }));
vi.mock("../src/domains/site-indexes/commands/build.command.js", () => ({
  initBuildCommand: mainTestMocks.initBuildCommand,
}));
vi.mock("../src/domains/site-indexes/commands/check.command.js", () => ({
  initCheckCommand: mainTestMocks.initCheckCommand,
}));
vi.mock("../src/domains/make/commands/make.command.js", () => ({
  initMakeCommand: mainTestMocks.initMakeCommand,
}));
vi.mock("../src/shared/services/logger.service.js", () => ({
  logger: {
    configure: mainTestMocks.configureLogger,
    error: mainTestMocks.loggerError,
  },
}));

afterEach(() => {
  resetMainTestMocks(mainTestMocks);
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

describe("main error handling", () => {
  it("logs Error instances and sets exit code", async () => {
    setRunMatchedCommandImpl(mainTestMocks, async () => {
      throw new Error("boom");
    });

    await main(["node", "site-index", "check"]);

    expect(mainTestMocks.loggerError).toHaveBeenCalledWith(expect.any(Error));
    expect(process.exitCode).toBe(1);
  });

  it("forwards non-Error throws to logger.error", async () => {
    setRunMatchedCommandImpl(mainTestMocks, async () => {
      throw 42;
    });

    await main(["node", "site-index", "check"]);

    expect(mainTestMocks.loggerError).toHaveBeenCalledWith(42);
    expect(process.exitCode).toBe(1);
  });
});
