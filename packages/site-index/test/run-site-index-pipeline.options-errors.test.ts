import { describe, expect, it, vi } from "vitest";
import { type LoadModule, runSiteIndexPipeline } from "../src/index.js";

describe("runSiteIndexPipeline option errors", () => {
  it.each([
    ["invalid siteUrl", { siteUrl: "not-a-url", rootPath: "/repo" }],
    ["empty rootPath", { siteUrl: "https://example.com", rootPath: "  " }],
    [
      "invalid extensions",
      { siteUrl: "https://example.com", rootPath: "/repo", extensions: ["ts"] },
    ],
  ])("rejects invalid options: %s", async (_name, input) => {
    const loadModule = vi.fn<LoadModule>(async () => ({ siteIndexes: [] }));

    await expect(
      runSiteIndexPipeline({
        ...input,
        loadModule,
      } as Parameters<typeof runSiteIndexPipeline>[0]),
    ).rejects.toThrow();

    expect(loadModule).not.toHaveBeenCalled();
  });

  it("rejects non-function loadModule", async () => {
    await expect(
      runSiteIndexPipeline({
        siteUrl: "https://example.com",
        rootPath: "/repo",
        loadModule: "not-a-function" as unknown as LoadModule,
      }),
    ).rejects.toThrow();
  });
});
