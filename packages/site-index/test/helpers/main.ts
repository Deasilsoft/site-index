import { vi } from "vitest";

type RunMatchedCommandImpl = () => Promise<void>;

export type MainTestMocks = {
  cli: {
    option: ReturnType<typeof vi.fn>;
    version: ReturnType<typeof vi.fn>;
    help: ReturnType<typeof vi.fn>;
    outputHelp: ReturnType<typeof vi.fn>;
    parse: ReturnType<typeof vi.fn>;
    runMatchedCommand: ReturnType<typeof vi.fn<RunMatchedCommandImpl>>;
  };
  cacMock: ReturnType<typeof vi.fn>;
  initBuildCommand: ReturnType<typeof vi.fn>;
  initCheckCommand: ReturnType<typeof vi.fn>;
  initMakeCommand: ReturnType<typeof vi.fn>;
  configureLogger: ReturnType<typeof vi.fn>;
  loggerError: ReturnType<typeof vi.fn>;
};

function resetCommandMocks(mainTestMocks: MainTestMocks): void {
  mainTestMocks.initBuildCommand.mockClear();
  mainTestMocks.initCheckCommand.mockClear();
  mainTestMocks.initMakeCommand.mockClear();
}

function resetLoggerMocks(mainTestMocks: MainTestMocks): void {
  mainTestMocks.configureLogger.mockClear();
  mainTestMocks.loggerError.mockClear();
}

function resetCliMocks(mainTestMocks: MainTestMocks): void {
  mainTestMocks.cli.option.mockClear();
  mainTestMocks.cli.version.mockClear();
  mainTestMocks.cli.help.mockClear();
  mainTestMocks.cli.outputHelp.mockClear();
  mainTestMocks.cli.parse.mockClear();
  mainTestMocks.cli.runMatchedCommand.mockClear();
  mainTestMocks.cli.runMatchedCommand.mockImplementation(async () => {});
}

export function setRunMatchedCommandImpl(
  mainTestMocks: MainTestMocks,
  implementation: RunMatchedCommandImpl,
): void {
  mainTestMocks.cli.runMatchedCommand.mockImplementation(implementation);
}

export function resetMainTestMocks(mainTestMocks: MainTestMocks): void {
  mainTestMocks.cacMock.mockClear();
  resetCommandMocks(mainTestMocks);
  resetLoggerMocks(mainTestMocks);
  resetCliMocks(mainTestMocks);
}
