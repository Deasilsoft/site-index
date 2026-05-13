import { afterEach, describe, expect, it, vi } from "vitest";
import pkg from "../package.json" with { type: "json" };
import { main } from "../src/main.js";
import { type MainTestMocks, resetMainTestMocks } from "./helpers/main.js";

const mainTestMocks = vi.hoisted<MainTestMocks>(() => {
  const cli = {
    option: vi.fn(),
    version: vi.fn(),
    help: vi.fn(),
    outputHelp: vi.fn(),
    parse: vi.fn((argv: string[]) => ({
      options: {
        help: argv.includes("--help"),
        version: argv.includes("--version"),
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

vi.mock("../src/shared/logging/logger.js", () => ({
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

describe("main CLI wiring", () => {
  it("shows help when no command args are provided", async () => {
    await main(["node", "site-index"]);

    expect(mainTestMocks.cacMock).toHaveBeenCalledWith("site-index");
    expect(mainTestMocks.initBuildCommand).toHaveBeenCalledWith(
      mainTestMocks.cli,
    );

    expect(mainTestMocks.initCheckCommand).toHaveBeenCalledWith(
      mainTestMocks.cli,
    );

    expect(mainTestMocks.initMakeCommand).toHaveBeenCalledWith(
      mainTestMocks.cli,
    );

    expect(mainTestMocks.cli.option).toHaveBeenCalledWith(
      "--quiet",
      "Suppress informational output",
    );

    expect(mainTestMocks.cli.option).toHaveBeenCalledWith(
      "--verbose",
      "Enable verbose logging",
    );

    expect(mainTestMocks.cli.version).toHaveBeenCalledWith(pkg.version);
    expect(mainTestMocks.cli.help).toHaveBeenCalled();
    expect(mainTestMocks.cli.outputHelp).toHaveBeenCalledOnce();
    expect(mainTestMocks.cli.parse).toHaveBeenCalledWith(
      ["node", "site-index"],
      { run: false },
    );

    expect(mainTestMocks.cli.runMatchedCommand).not.toHaveBeenCalled();
    expect(mainTestMocks.configureLogger).toHaveBeenCalledWith({
      quiet: false,
      verbose: false,
    });

    expect(process.exitCode).toBeUndefined();
  });

  it("parses argv and runs matched command on success", async () => {
    await main(["node", "site-index", "build", "--site-url", "https://a.com"]);

    expect(mainTestMocks.cli.parse).toHaveBeenCalledWith(
      ["node", "site-index", "build", "--site-url", "https://a.com"],
      { run: false },
    );

    expect(mainTestMocks.cli.runMatchedCommand).toHaveBeenCalledOnce();
    expect(mainTestMocks.configureLogger).toHaveBeenCalledWith({
      quiet: false,
      verbose: false,
    });

    expect(process.exitCode).toBeUndefined();
  });

  it.each([["--quiet"], ["--verbose"], ["--quiet", "--verbose"]])(
    "shows help for option-only invocation: %p",
    async (...args) => {
      await main(["node", "site-index", ...args]);

      expect(mainTestMocks.cli.outputHelp).toHaveBeenCalledOnce();
      expect(mainTestMocks.cli.runMatchedCommand).not.toHaveBeenCalled();
    },
  );

  it("does not run matched command when --help is passed", async () => {
    await main(["node", "site-index", "--help"]);

    expect(mainTestMocks.cli.outputHelp).not.toHaveBeenCalled();
    expect(mainTestMocks.cli.runMatchedCommand).not.toHaveBeenCalled();
  });

  it("does not run matched command when --version is passed", async () => {
    await main(["node", "site-index", "--version"]);

    expect(mainTestMocks.cli.outputHelp).not.toHaveBeenCalled();
    expect(mainTestMocks.cli.runMatchedCommand).not.toHaveBeenCalled();
  });

  it("passes parsed --verbose and --quiet through logger configuration", async () => {
    mainTestMocks.cli.parse.mockReturnValueOnce({
      options: {
        help: false,
        version: false,
        quiet: true,
        verbose: false,
      },
    });

    await main(["node", "site-index", "check", "--verbose", "--quiet"]);

    expect(mainTestMocks.configureLogger).toHaveBeenCalledWith({
      quiet: true,
      verbose: false,
    });
  });
});
