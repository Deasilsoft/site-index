import * as SiteIndex from "@site-index/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createNode } from "./helpers/module-node.factory.js";
import { createAttachedRuntimeSetup } from "./helpers/runtime.setup.js";
import { createViteServerMock } from "./helpers/vite-server.mock.js";

vi.mock("@site-index/core", async () => {
  const actual =
    await vi.importActual<typeof import("@site-index/core")>(
      "@site-index/core",
    );

  return {
    ...actual,
    main: vi.fn(),
  };
});

describe("RuntimeService rebuild rejections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps artifacts and watched files when rebuild fails", async () => {
    vi.mocked(SiteIndex.main)
      .mockImplementationOnce(async (options) => {
        await options.loadModule({
          filePath: "/repo/src/routes/a.site-index.ts",
          importId: "./src/routes/a.site-index.ts",
        });

        return {
          data: [
            new SiteIndex.Artifact({
              filePath: "sitemap.xml",
              content: "STABLE_XML",
            }),
          ],
          warnings: [],
        };
      })
      .mockRejectedValueOnce(new Error("refresh exploded"));

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
    await expect(runtime.buildArtifacts()).rejects.toThrow("refresh exploded");

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

  it("keeps previous watched files when a rebuild has unresolved module nodes", async () => {
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
          filePath: "/repo/src/routes/missing.site-index.ts",
          importId: "./src/routes/missing.site-index.ts",
        });

        return { data: [], warnings: [] };
      });

    const viteServer = createViteServerMock({
      modulesByUrl: {
        "./src/routes/a.site-index.ts": createNode(
          "/repo/src/routes/a.site-index.ts",
          [createNode("/repo/src/site-indexes/dep.ts")],
        ),
      },
    });

    const runtime = createAttachedRuntimeSetup(viteServer.server);

    await runtime.buildArtifacts();

    await expect(runtime.buildArtifacts()).rejects.toThrow(
      'Unable to resolve loaded module "./src/routes/missing.site-index.ts"',
    );

    expect(runtime.getWatchedFiles()).toEqual(
      new Set([
        "/repo/src/routes/a.site-index.ts",
        "/repo/src/site-indexes/dep.ts",
      ]),
    );
  });

  it("allows a later build to succeed after an initial build failure", async () => {
    vi.mocked(SiteIndex.main)
      .mockRejectedValueOnce(new Error("initial build exploded"))
      .mockImplementationOnce(async (options) => {
        await options.loadModule({
          filePath: "/repo/src/routes/a.site-index.ts",
          importId: "./src/routes/a.site-index.ts",
        });

        return {
          data: [
            new SiteIndex.Artifact({
              filePath: "sitemap.xml",
              content: "RECOVERED_XML",
            }),
          ],
          warnings: [],
        };
      });

    const viteServer = createViteServerMock({
      modulesByUrl: {
        "./src/routes/a.site-index.ts": createNode(
          "/repo/src/routes/a.site-index.ts",
          [createNode("/repo/src/deps/a-dep.ts")],
        ),
      },
    });

    const runtime = createAttachedRuntimeSetup(viteServer.server);

    await expect(runtime.buildArtifacts()).rejects.toThrow(
      "initial build exploded",
    );

    expect(runtime.getArtifacts()).toEqual([]);
    expect(runtime.getWatchedFiles()).toEqual(new Set());

    await expect(runtime.buildArtifacts()).resolves.toEqual({
      data: [
        {
          filePath: "sitemap.xml",
          content: "RECOVERED_XML",
          contentType: "application/xml; charset=utf-8",
        },
      ],
      warnings: [],
    });

    expect(runtime.getArtifacts()).toEqual([
      {
        filePath: "sitemap.xml",
        content: "RECOVERED_XML",
        contentType: "application/xml; charset=utf-8",
      },
    ]);

    expect(runtime.getWatchedFiles()).toEqual(
      new Set(["/repo/src/routes/a.site-index.ts", "/repo/src/deps/a-dep.ts"]),
    );
  });
});
