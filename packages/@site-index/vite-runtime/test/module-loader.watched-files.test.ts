import * as SiteIndex from "@site-index/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRuntimeService } from "../src/index.js";
import { createViteServerMock } from "./helpers/vite-server.mock.js";

vi.mock("@site-index/core", () => ({
  main: vi.fn(),
}));

type ModuleNode = {
  file?: string | undefined;
  importedModules: Set<ModuleNode>;
};

function createModule(file?: string): ModuleNode {
  return {
    file,
    importedModules: new Set(),
  };
}

describe("ModuleLoader watched-file graph", () => {
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

    const viteServer = createViteServerMock({
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
      .withViteServer(viteServer.server)
      .build();

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
    const virtual = createModule();

    aliasEntry.importedModules.add(aliasResolved);
    aliasEntry.importedModules.add(virtual);

    const viteServer = createViteServerMock({
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
      .withViteServer(viteServer.server)
      .build();

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
    const dependencyA = createModule("/repo/src/content/a.ts");
    const dependencyB = createModule("/repo/src/content/b.ts");

    entry.importedModules.add(dependencyA);
    dependencyA.importedModules.add(dependencyB);
    dependencyB.importedModules.add(entry);

    const viteServer = createViteServerMock({
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
      .withViteServer(viteServer.server)
      .build();

    await runtime.buildArtifacts();

    expect(runtime.getWatchedFiles()).toEqual(
      new Set([
        "/repo/src/routes/cycle.site-index.ts",
        "/repo/src/content/a.ts",
        "/repo/src/content/b.ts",
      ]),
    );
  });

  it("tracks deep dependency chains from a loaded entry", async () => {
    const depth = 40;
    const entry = createModule("/repo/src/routes/deep.site-index.ts");
    const expected = [entry.file!];

    let current = entry;

    for (let index = 0; index < depth; index += 1) {
      const file = `/repo/src/content/deep-${index}.ts`;
      const next = createModule(file);

      current.importedModules.add(next);
      expected.push(file);

      current = next;
    }

    const viteServer = createViteServerMock({
      modulesByUrl: {
        "./src/routes/deep.site-index.ts": entry as never,
      },
    });

    vi.mocked(SiteIndex.main).mockImplementation(async (options) => {
      await options.loadModule({
        filePath: "/repo/src/routes/deep.site-index.ts",
        importId: "./src/routes/deep.site-index.ts",
      });

      return { data: [], warnings: [] };
    });

    const runtime = createRuntimeService()
      .withOptions({ siteUrl: "https://example.com" })
      .withViteServer(viteServer.server)
      .build();

    await runtime.buildArtifacts();

    expect(runtime.getWatchedFiles()).toEqual(new Set(expected));
    expect(viteServer.lookedUpUrls).toEqual([
      "./src/routes/deep.site-index.ts",
    ]);
  });
});
