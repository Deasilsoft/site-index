import * as SiteIndex from "@site-index/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createNode } from "./helpers/module-node.factory.js";
import { createAttachedRuntimeSetup } from "./helpers/runtime.setup.js";
import { createViteServerMock } from "./helpers/vite-server.mock.js";

vi.mock("@site-index/core", () => ({
  main: vi.fn(),
}));

describe("RuntimeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads modules via SSR and persists artifacts and watched files", async () => {
    vi.mocked(SiteIndex.main).mockImplementation(async (options) => {
      await options.loadModule({
        filePath: "/repo/src/routes/a.site-index.ts",
        importId: "./src/routes/a.site-index.ts",
      });

      await options.loadModule({
        filePath: "/repo/src/routes/b.site-index.ts",
        importId: "@/routes/b.site-index.ts",
      });

      return {
        data: [
          {
            filePath: "sitemap.xml",
            content: "INDEX_XML",
            contentType: "application/xml; charset=utf-8",
          },
        ],
        warnings: [{ message: "Duplicate URL: /blog" }],
      };
    });

    const entryA = createNode("/repo/src/routes/a.site-index.ts", [
      createNode("/repo/src/deps/shared-a.ts"),
    ]);

    const entryB = createNode("/repo/src/routes/b.site-index.ts", [
      createNode("/repo/src/deps/shared-b.ts"),
    ]);

    const viteServer = createViteServerMock();

    viteServer.queueSsrLoadedModules([
      viteServer.createSiteIndexModule([{ url: "/a" }]),
      viteServer.createSiteIndexModule([{ url: "/b" }]),
    ]);

    viteServer.setModulesByUrl({
      "./src/routes/a.site-index.ts": entryA,
      "@/routes/b.site-index.ts": entryB,
    });

    const runtime = createAttachedRuntimeSetup(viteServer.server);

    const result = await runtime.buildArtifacts();

    expect(viteServer.ssrLoadModule).toHaveBeenNthCalledWith(
      1,
      "./src/routes/a.site-index.ts",
    );

    expect(viteServer.ssrLoadModule).toHaveBeenNthCalledWith(
      2,
      "@/routes/b.site-index.ts",
    );

    expect(result).toEqual({
      data: [
        {
          filePath: "sitemap.xml",
          content: "INDEX_XML",
          contentType: "application/xml; charset=utf-8",
        },
      ],
      warnings: [{ message: "Duplicate URL: /blog" }],
    });

    expect(runtime.getArtifacts()).toEqual(result.data);
    expect(runtime.getWatchedFiles()).toEqual(
      new Set([
        "/repo/src/routes/a.site-index.ts",
        "/repo/src/routes/b.site-index.ts",
        "/repo/src/deps/shared-a.ts",
        "/repo/src/deps/shared-b.ts",
      ]),
    );
  });

  it("returns snapshot getters for artifacts and watched files", async () => {
    vi.mocked(SiteIndex.main).mockImplementation(async (options) => {
      await options.loadModule({
        filePath: "/repo/src/routes/a.site-index.ts",
        importId: "./src/routes/a.site-index.ts",
      });

      return {
        data: [
          {
            filePath: "sitemap.xml",
            content: "ORIGINAL",
            contentType: "application/xml; charset=utf-8",
          },
        ],
        warnings: [],
      };
    });

    const watchedNode = createNode("/repo/src/routes/a.site-index.ts", [
      createNode("/repo/src/deps/shared.ts"),
    ]);
    const viteServer = createViteServerMock({
      modulesByUrl: {
        "./src/routes/a.site-index.ts": watchedNode,
      },
    });

    const runtime = createAttachedRuntimeSetup(viteServer.server);
    await runtime.buildArtifacts();

    const artifacts = runtime.getArtifacts() as SiteIndex.Artifact[];
    artifacts[0]!.content = "MUTATED";
    artifacts.push({
      filePath: "robots.txt",
      content: "MUTATED",
      contentType: "text/plain; charset=utf-8",
    });

    const watchedFiles = runtime.getWatchedFiles() as Set<string>;
    watchedFiles.clear();
    watchedFiles.add("/tmp/fake.ts");

    expect(runtime.getArtifacts()).toEqual([
      {
        filePath: "sitemap.xml",
        content: "ORIGINAL",
        contentType: "application/xml; charset=utf-8",
      },
    ]);
    expect(runtime.getWatchedFiles()).toEqual(
      new Set(["/repo/src/routes/a.site-index.ts", "/repo/src/deps/shared.ts"]),
    );
  });
});
