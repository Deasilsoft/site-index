import * as SiteIndex from "@site-index/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createNode } from "./helpers/module-node.factory.js";
import { createAttachedRuntimeSetup } from "./helpers/runtime.setup.js";
import { createViteServerMock } from "./helpers/vite-server.mock.js";

vi.mock("@site-index/core", () => ({
  main: vi.fn(),
}));

describe("RuntimeService build state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists artifacts and watched files after a successful build", async () => {
    vi.mocked(SiteIndex.main).mockImplementation(async (options) => {
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
    });

    const watchedNode = createNode("/repo/src/routes/a.site-index.ts", [
      createNode("/repo/src/site-indexes/dep.ts"),
    ]);

    const viteServer = createViteServerMock({
      modulesByUrl: {
        "./src/routes/a.site-index.ts": watchedNode,
      },
    });

    const runtime = createAttachedRuntimeSetup(viteServer.server);

    await runtime.buildArtifacts();

    expect(runtime.getArtifacts()).toEqual([
      {
        filePath: "sitemap.xml",
        content: "STABLE_XML",
        contentType: "application/xml; charset=utf-8",
      },
    ]);
    expect(runtime.getWatchedFiles()).toEqual(
      new Set([
        "/repo/src/routes/a.site-index.ts",
        "/repo/src/site-indexes/dep.ts",
      ]),
    );
  });
});
