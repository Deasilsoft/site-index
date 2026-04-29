import * as ViteRuntime from "@site-index/vite-runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCheck } from "../src/domains/site-indexes/check.service.js";
import { createRuntimeServiceMock } from "./helpers/runtime.service.mock.js";
import { captureStreams } from "./helpers/streams.js";

const runtimeMocks = createRuntimeServiceMock();

beforeEach(() => {
  runtimeMocks.reset();
  vi.spyOn(ViteRuntime, "createRuntimeService").mockImplementation(
    runtimeMocks.createRuntimeService as never,
  );
});

afterEach(async () => {
  vi.restoreAllMocks();
});

describe("check service", () => {
  it("succeeds when there are no warnings", async () => {
    runtimeMocks.runtime.buildArtifacts.mockResolvedValue({
      data: [],
      warnings: [],
    });

    await expect(
      runCheck({
        siteUrl: "https://example.com",
        rootPath: "/project",
      }),
    ).resolves.toBeUndefined();
  });

  it("prints warnings and fails when warnings exist", async () => {
    const output = captureStreams();

    runtimeMocks.runtime.buildArtifacts.mockResolvedValue({
      data: [],
      warnings: [{ message: "A", filePath: "a.ts" }, { message: "B" }],
    });

    try {
      await expect(
        runCheck({
          siteUrl: "https://example.com",
          rootPath: "/project",
        }),
      ).rejects.toThrow("Check failed with 2 warning(s)");
    } finally {
      output.restore();
    }

    const stderr = output.stderr();
    expect(stderr).toContain("Warning: A");
    expect(stderr).toContain("  at a.ts");
    expect(stderr).toContain("Warning: B");
  });

  it("closes runtime when buildArtifacts throws", async () => {
    runtimeMocks.runtime.buildArtifacts.mockRejectedValue(new Error("boom"));

    await expect(
      runCheck({
        siteUrl: "https://example.com",
        rootPath: "/project",
      }),
    ).rejects.toThrow("boom");

    expect(runtimeMocks.runtime.close).toHaveBeenCalledTimes(1);
  });

  it("keeps Vite config discovery enabled when --config is not provided", async () => {
    runtimeMocks.runtime.buildArtifacts.mockResolvedValue({
      data: [],
      warnings: [],
    });

    await runCheck({
      siteUrl: "https://example.com",
      rootPath: "/project",
    });

    const resolvedConfig = (
      runtimeMocks.withViteConfig.mock.calls as unknown as Array<
        [Record<string, unknown>]
      >
    )[0]?.[0];

    expect(resolvedConfig).toMatchObject({
      root: "/project",
      mode: "production",
    });
    expect(resolvedConfig).not.toHaveProperty("configFile");
  });

  it("passes explicit configFile when --config is provided", async () => {
    runtimeMocks.runtime.buildArtifacts.mockResolvedValue({
      data: [],
      warnings: [],
    });

    await runCheck({
      siteUrl: "https://example.com",
      rootPath: "/project",
      configFile: "/project/vite.config.ts",
    });

    const resolvedConfig = (
      runtimeMocks.withViteConfig.mock.calls as unknown as Array<
        [Record<string, unknown>]
      >
    )[0]?.[0];
    expect(resolvedConfig).toMatchObject({
      root: "/project",
      mode: "production",
      configFile: "/project/vite.config.ts",
    });
  });
});
