import * as SiteIndex from "@site-index/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRuntimeService } from "../src/index.js";
import { createViteServerStub } from "./helpers/vite-server.harness.js";

vi.mock("@site-index/core", () => ({
  main: vi.fn(),
}));

type ModuleNode = {
  file: string | null;
  importedModules: Set<ModuleNode>;
};

function createModule(file: string | null): ModuleNode {
  return {
    file,
    importedModules: new Set(),
  };
}

describe("RuntimeService watched-file graph", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("traverses dependencies recursively from each loaded module", async () => {
    const blogEntry = createModule("/repo/src/routes/blog.site-index.ts");
    const docsEntry = createModule("/repo/src/routes/docs.site-index.ts");
    const shared = createModule("/repo/src/content/shared.ts");
    const docs = createModule("/repo/src/content/docs.ts");

    blogEntry.importedModules.add(shared);
    docsEntry.importedModules.add(docs);
    docs.importedModules.add(shared);

    const viteServer = createViteServerStub({
      modulesByUrl: {
        "./src/routes/blog.site-index.ts": blogEntry as never,
        "./src/routes/docs.site-index.ts": docsEntry as never,
      },
    });

    vi.mocked(SiteIndex.main).mockImplementation(async (options) => {
      await options.loadModule({
        filePath: "/repo/src/routes/blog.site-index.ts",
        importId: "./src/routes/blog.site-index.ts",
      });
      await options.loadModule({
        filePath: "/repo/src/routes/docs.site-index.ts",
        importId: "./src/routes/docs.site-index.ts",
      });

      return { data: [], warnings: [] };
    });

    const runtime = createRuntimeService()
      .withOptions({ siteUrl: "https://example.com" })
      .build();

    runtime.attachViteServer(viteServer.server);
    await runtime.buildArtifacts();

    expect(runtime.getWatchedFiles()).toEqual(
      new Set([
        "/repo/src/routes/blog.site-index.ts",
        "/repo/src/routes/docs.site-index.ts",
        "/repo/src/content/docs.ts",
        "/repo/src/content/shared.ts",
      ]),
    );
    expect(viteServer.lookedUpUrls).toEqual([
      "./src/routes/blog.site-index.ts",
      "./src/routes/docs.site-index.ts",
    ]);
  });

  it("handles aliases, unresolved ids, and virtual modules", async () => {
    const aliasEntry = createModule("/repo/src/routes/alias.site-index.ts");
    const aliasResolved = createModule("/repo/src/lib/real.ts");
    const virtual = createModule(null);

    aliasEntry.importedModules.add(aliasResolved);
    aliasEntry.importedModules.add(virtual);

    const viteServer = createViteServerStub({
      modulesByUrl: {
        "@/routes/alias.site-index.ts": aliasEntry as never,
      },
    });

    vi.mocked(SiteIndex.main).mockImplementation(async (options) => {
      await options.loadModule({
        filePath: "/repo/src/routes/alias.site-index.ts",
        importId: "@/routes/alias.site-index.ts",
      });

      return { data: [], warnings: [] };
    });

    const runtime = createRuntimeService()
      .withOptions({ siteUrl: "https://example.com" })
      .build();

    runtime.attachViteServer(viteServer.server);
    await runtime.buildArtifacts();

    expect(runtime.getWatchedFiles()).toEqual(
      new Set([
        "/repo/src/routes/alias.site-index.ts",
        "/repo/src/lib/real.ts",
      ]),
    );
    expect(viteServer.lookedUpUrls).toEqual(["@/routes/alias.site-index.ts"]);
  });

  it("avoids infinite recursion for cyclic imports", async () => {
    const entry = createModule("/repo/src/routes/cycle.site-index.ts");
    const depA = createModule("/repo/src/content/a.ts");
    const depB = createModule("/repo/src/content/b.ts");

    entry.importedModules.add(depA);
    depA.importedModules.add(depB);
    depB.importedModules.add(entry);

    const viteServer = createViteServerStub({
      modulesByUrl: {
        "./src/routes/cycle.site-index.ts": entry as never,
      },
    });

    vi.mocked(SiteIndex.main).mockImplementation(async (options) => {
      await options.loadModule({
        filePath: "/repo/src/routes/cycle.site-index.ts",
        importId: "./src/routes/cycle.site-index.ts",
      });

      return { data: [], warnings: [] };
    });

    const runtime = createRuntimeService()
      .withOptions({ siteUrl: "https://example.com" })
      .build();

    runtime.attachViteServer(viteServer.server);
    await runtime.buildArtifacts();

    expect(runtime.getWatchedFiles()).toEqual(
      new Set([
        "/repo/src/routes/cycle.site-index.ts",
        "/repo/src/content/a.ts",
        "/repo/src/content/b.ts",
      ]),
    );
  });
});
