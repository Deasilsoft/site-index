import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runCheck } from "../../../src/domains/site-indexes/check.service.js";
import { captureStreams } from "../../helpers/streams.js";

const runtimeMocks = vi.hoisted(() => {
  let warningListener:
    | ((warning: { message: string; filePath?: string }) => void)
    | undefined;

  const runtime = {
    runSiteIndex: vi.fn(),
    onWarning: vi.fn(
      (listener: (warning: { message: string; filePath?: string }) => void) => {
        warningListener = listener;

        return () => {
          warningListener = undefined;
        };
      },
    ),
    close: vi.fn(async () => {}),
  };

  return {
    makeViteSiteIndexService: vi.fn(() => runtime),
    runtime,
    emitWarning: (warning: { message: string; filePath?: string }) => {
      warningListener?.(warning);
    },
  };
});

vi.mock("@site-index/vite-runtime", () => ({
  makeViteSiteIndexService: runtimeMocks.makeViteSiteIndexService,
}));

beforeEach(() => {
  runtimeMocks.runtime.runSiteIndex.mockReset();
  runtimeMocks.runtime.onWarning.mockClear();
  runtimeMocks.runtime.close.mockReset();
});

afterEach(async () => {
  vi.restoreAllMocks();
});

describe("check service", () => {
  it("succeeds when there are no warnings", async () => {
    runtimeMocks.runtime.runSiteIndex.mockResolvedValue({
      artifacts: [],
      loadedModules: [],
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

    runtimeMocks.runtime.runSiteIndex.mockImplementation(async () => {
      runtimeMocks.emitWarning({ message: "A", filePath: "a.ts" });
      runtimeMocks.emitWarning({ message: "B" });

      return {
        artifacts: [],
        loadedModules: [],
      };
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
