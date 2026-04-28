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

export function setRunMatchedCommandImpl(
  mainTestMocks: MainTestMocks,
  implementation: RunMatchedCommandImpl,
): void {
  mainTestMocks.cli.runMatchedCommand.mockImplementation(implementation);
}

export function resetMainTestMocks(mainTestMocks: MainTestMocks): void {
  mainTestMocks.cacMock.mockClear();
  mainTestMocks.initBuildCommand.mockClear();
  mainTestMocks.initCheckCommand.mockClear();
  mainTestMocks.initMakeCommand.mockClear();
  mainTestMocks.configureLogger.mockClear();
  mainTestMocks.loggerError.mockClear();

  mainTestMocks.cli.option.mockClear();
  mainTestMocks.cli.version.mockClear();
  mainTestMocks.cli.help.mockClear();
  mainTestMocks.cli.outputHelp.mockClear();
  mainTestMocks.cli.parse.mockClear();
  mainTestMocks.cli.runMatchedCommand.mockClear();
  mainTestMocks.cli.runMatchedCommand.mockImplementation(async () => {});
}
