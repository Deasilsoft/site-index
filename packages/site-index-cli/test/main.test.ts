import { beforeEach, describe, expect, it, vi } from "vitest";

const { loggerErrorMock, runBuildMock, runCheckMock } = vi.hoisted(() => ({
  loggerErrorMock: vi.fn(),
  runBuildMock: vi.fn(async () => undefined),
  runCheckMock: vi.fn(async () => undefined),
}));

vi.mock("../src/build/run.js", () => ({
  runBuild: runBuildMock,
}));

vi.mock("../src/check/run.js", () => ({
  runCheck: runCheckMock,
}));

vi.mock("../src/logger/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: loggerErrorMock,
  },
}));

const { main } = await import("../src/main.js");

describe("site-index CLI", () => {
  beforeEach(() => {
    process.exitCode = undefined;
    loggerErrorMock.mockReset();
    runBuildMock.mockReset();
    runCheckMock.mockReset();
    runBuildMock.mockResolvedValue(undefined);
    runCheckMock.mockResolvedValue(undefined);
  });

  it("shows help when invoked without a command", async () => {
    await expect(main(["node", "site-index"])).resolves.toBeUndefined();
    expect(runBuildMock).not.toHaveBeenCalled();
    expect(runCheckMock).not.toHaveBeenCalled();
  });

  it("delegates build command execution to build/run.ts", async () => {
    await expect(
      main([
        "node",
        "site-index",
        "build",
        "--site-url",
        "https://example.com",
        "--root",
        "/repo",
        "--out-dir",
        "public",
        "--config",
        "vite.custom.ts",
        "--mode",
        "production",
      ]),
    ).resolves.toBeUndefined();

    expect(runBuildMock).toHaveBeenCalledWith({
      root: "/repo",
      siteUrl: "https://example.com",
      outDir: "public",
      config: "vite.custom.ts",
      mode: "production",
    });
  });

  it("delegates check command execution to check/run.ts", async () => {
    await expect(
      main([
        "node",
        "site-index",
        "check",
        "--site-url",
        "https://example.com",
        "--root",
        "/repo",
        "--config",
        "vite.custom.ts",
        "--mode",
        "ci",
      ]),
    ).resolves.toBeUndefined();

    expect(runCheckMock).toHaveBeenCalledWith({
      root: "/repo",
      siteUrl: "https://example.com",
      config: "vite.custom.ts",
      mode: "ci",
    });
  });

  it("prints a concise error by default", async () => {
    await expect(
      main(["node", "site-index", "check"]),
    ).resolves.toBeUndefined();

    expect(loggerErrorMock).toHaveBeenCalledWith(
      "Missing required option: --site-url <url>",
    );
    expect(process.exitCode).toBe(1);
  });

  it("prints stack details with --verbose", async () => {
    await expect(
      main(["node", "site-index", "check", "--verbose"]),
    ).resolves.toBeUndefined();

    expect(loggerErrorMock).toHaveBeenCalledOnce();
    expect(String(loggerErrorMock.mock.calls[0]?.[0])).toContain(
      "Error: Missing required option: --site-url <url>",
    );
    expect(process.exitCode).toBe(1);
  });
});
