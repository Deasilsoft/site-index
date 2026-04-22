import { describe, expect, it, vi } from "vitest";
import { runSiteIndexPipeline, type ModuleLoader } from "../src/index.js";

describe("runSiteIndexPipeline option errors", () => {
  it.each([
    ["invalid siteUrl", { siteUrl: "not-a-url", rootPath: "/repo" }],
    ["empty rootPath", { siteUrl: "https://example.com", rootPath: "  " }],
    [
      "invalid extensions",
      { siteUrl: "https://example.com", rootPath: "/repo", extensions: ["ts"] },
    ],
  ])("rejects invalid options: %s", async (_name, input) => {
    const loadModules = vi.fn<ModuleLoader>(async () => ({
      data: [],
      warnings: [],
    }));

    await expect(
      runSiteIndexPipeline({
        ...input,
        loadModules,
      } as Parameters<typeof runSiteIndexPipeline>[0]),
    ).rejects.toThrow();

    expect(loadModules).not.toHaveBeenCalled();
  });

  it("rejects non-function loadModules", async () => {
    await expect(
      runSiteIndexPipeline({
        siteUrl: "https://example.com",
        rootPath: "/repo",
        loadModules: "not-a-function" as unknown as ModuleLoader,
      }),
    ).rejects.toThrow();
  });
});
