import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCheck } from "../src/domains/site-indexes/check.service.js";
import { captureStreams } from "./helpers/streams.js";

const runtimeMocks = vi.hoisted(() => {
  const runtime = {
    buildArtifacts: vi.fn(),
    close: vi.fn(async () => {}),
  };

  const builder = {
    withOptions: vi.fn(() => ({
      withViteConfig: vi.fn(() => ({
        build: vi.fn(() => runtime),
      })),
    })),
  };

  return {
    createRuntimeService: vi.fn(() => builder),
    runtime,
    builder,
  };
});

vi.mock("@site-index/vite-runtime", () => ({
  createRuntimeService: runtimeMocks.createRuntimeService,
}));

beforeEach(() => {
  runtimeMocks.runtime.buildArtifacts.mockReset();
  runtimeMocks.runtime.close.mockReset();
  runtimeMocks.builder.withOptions.mockClear();
  runtimeMocks.createRuntimeService.mockClear();
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
    expect(stderr).toContain("\tat a.ts");
    expect(stderr).toContain("Warning: B");
  });
});
