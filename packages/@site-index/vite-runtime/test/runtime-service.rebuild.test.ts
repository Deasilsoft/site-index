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

  it("serializes concurrent buildArtifacts calls", async () => {
    let activeBuilds = 0;
    let maxActiveBuilds = 0;
    const releases: Array<() => void> = [];

    vi.mocked(SiteIndex.main).mockImplementation(async () => {
      activeBuilds += 1;
      maxActiveBuilds = Math.max(maxActiveBuilds, activeBuilds);

      await new Promise<void>((resolve) => {
        releases.push(resolve);
      });

      activeBuilds -= 1;

      return {
        data: [],
        warnings: [],
      };
    });

    const runtime = createAttachedRuntimeSetup(createViteServerMock().server);

    const firstBuild = runtime.buildArtifacts();
    const secondBuild = runtime.buildArtifacts();

    await vi.waitFor(() => {
      expect(SiteIndex.main).toHaveBeenCalledTimes(1);
    });
    expect(releases).toHaveLength(1);

    releases.shift()?.();

    await vi.waitFor(() => {
      expect(SiteIndex.main).toHaveBeenCalledTimes(2);
    });
    expect(releases).toHaveLength(1);

    releases.shift()?.();

    await Promise.all([firstBuild, secondBuild]);

    expect(maxActiveBuilds).toBe(1);
    expect(SiteIndex.main).toHaveBeenCalledTimes(2);
  });

  it("replaces watched files after a successful rebuild", async () => {
    vi.mocked(SiteIndex.main)
      .mockImplementationOnce(async (options) => {
        await options.loadModule({
          filePath: "/repo/src/routes/a.site-index.ts",
          importId: "./src/routes/a.site-index.ts",
        });

        return { data: [], warnings: [] };
      })
      .mockImplementationOnce(async (options) => {
        await options.loadModule({
          filePath: "/repo/src/routes/b.site-index.ts",
          importId: "./src/routes/b.site-index.ts",
        });

        return { data: [], warnings: [] };
      });

    const viteServer = createViteServerMock({
      modulesByUrl: {
        "./src/routes/a.site-index.ts": createNode(
          "/repo/src/routes/a.site-index.ts",
          [createNode("/repo/src/deps/a-dep.ts")],
        ),
        "./src/routes/b.site-index.ts": createNode(
          "/repo/src/routes/b.site-index.ts",
          [createNode("/repo/src/deps/b-dep.ts")],
        ),
      },
    });

    const runtime = createAttachedRuntimeSetup(viteServer.server);

    await runtime.buildArtifacts();
    expect(runtime.getWatchedFiles()).toEqual(
      new Set(["/repo/src/routes/a.site-index.ts", "/repo/src/deps/a-dep.ts"]),
    );

    await runtime.buildArtifacts();
    expect(runtime.getWatchedFiles()).toEqual(
      new Set(["/repo/src/routes/b.site-index.ts", "/repo/src/deps/b-dep.ts"]),
    );
  });
});
