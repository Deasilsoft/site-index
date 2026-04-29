import * as SiteIndex from "@site-index/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRuntimeService } from "../src/index.js";
import { createNode } from "./helpers/module-node.factory.js";
import { createViteServerStub } from "./helpers/vite-server.harness.js";

vi.mock("@site-index/core", () => ({
  main: vi.fn(),
}));

describe("RuntimeService rebuild rejections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps artifacts but clears watched files when rebuild fails", async () => {
    vi.mocked(SiteIndex.main)
      .mockImplementationOnce(async (options) => {
        await options.loadModule({
          filePath: "/repo/src/routes/a.site-index.ts",
          importId: "./src/routes/a.site-index.ts",
        });

        return {
          data: [
            {
              filePath: "sitemap.xml",
              content: "STABLE_XML",
              contentType: "application/xml; charset=utf-8",
            },
          ],
          warnings: [],
        };
      })
      .mockRejectedValueOnce(new Error("refresh exploded"));

    const watchedNode = createNode("/repo/src/routes/a.site-index.ts", [
      createNode("/repo/src/site-indexes/dep.ts"),
    ]);

    const viteServer = createViteServerStub({
      modulesByUrl: {
        "./src/routes/a.site-index.ts": watchedNode,
      },
    });

    const runtime = createRuntimeService()
      .withOptions({ siteUrl: "https://example.com" })
      .build();

    runtime.attachViteServer(viteServer.server);

    await runtime.buildArtifacts();
    await expect(runtime.buildArtifacts()).rejects.toThrow("refresh exploded");

    expect(runtime.getArtifacts()).toEqual([
      {
        filePath: "sitemap.xml",
        content: "STABLE_XML",
        contentType: "application/xml; charset=utf-8",
      },
    ]);
    expect(runtime.getWatchedFiles()).toEqual(new Set());
  });
});
