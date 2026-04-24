import type * as Vite from "vite";
import { describe, expect, it } from "vitest";
import { collectRelevantFiles } from "../src/shared/vite-dependency-graph.js";

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

function createServerByUrl(modulesByUrl: Record<string, ModuleNode>): {
  server: Vite.ViteDevServer;
  lookedUpUrls: string[];
} {
  const lookedUpUrls: string[] = [];

  return {
    server: {
      moduleGraph: {
        getModuleByUrl: async () => {
          throw new Error(
            "collectRelevantFiles should query the SSR environment graph",
          );
        },
      },
      environments: {
        ssr: {
          moduleGraph: {
            getModuleByUrl: async (url: string) => {
              lookedUpUrls.push(url);
              return modulesByUrl[url] as never;
            },
          },
        },
      },
    } as never,
    lookedUpUrls,
  };
}

describe("collectRelevantFiles", () => {
  it("traverses recursively from each tracked entry import id", async () => {
    const blogEntry = createModule("/repo/src/routes/blog.site-index.ts");
    const docsEntry = createModule("/repo/src/routes/docs.site-index.ts");
    const shared = createModule("/repo/src/content/shared.ts");
    const docs = createModule("/repo/src/content/docs.ts");

    blogEntry.importedModules.add(shared);
    docsEntry.importedModules.add(docs);
    docs.importedModules.add(shared);

    const { lookedUpUrls, server } = createServerByUrl({
      "./src/routes/blog.site-index.ts": blogEntry,
      "./src/routes/docs.site-index.ts": docsEntry,
    });

    const files = await collectRelevantFiles(server, [
      "./src/routes/blog.site-index.ts",
      "./src/routes/docs.site-index.ts",
    ]);

    expect(files).toEqual(
      new Set([
        "/repo/src/routes/blog.site-index.ts",
        "/repo/src/routes/docs.site-index.ts",
        "/repo/src/content/docs.ts",
        "/repo/src/content/shared.ts",
      ]),
    );
    expect(lookedUpUrls).toEqual([
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

    const { lookedUpUrls, server } = createServerByUrl({
      "@/routes/alias.site-index.ts": aliasEntry,
    });

    const files = await collectRelevantFiles(server, [
      "@/routes/alias.site-index.ts",
      "./missing.site-index.ts",
    ]);

    expect(files).toEqual(
      new Set([
        "/repo/src/routes/alias.site-index.ts",
        "/repo/src/lib/real.ts",
      ]),
    );
    expect(lookedUpUrls).toEqual([
      "@/routes/alias.site-index.ts",
      "./missing.site-index.ts",
    ]);
  });

  it("avoids infinite recursion when module imports form a cycle", async () => {
    const entry = createModule("/repo/src/routes/cycle.site-index.ts");
    const depA = createModule("/repo/src/content/a.ts");
    const depB = createModule("/repo/src/content/b.ts");

    entry.importedModules.add(depA);
    depA.importedModules.add(depB);
    depB.importedModules.add(entry);

    const { server } = createServerByUrl({
      "./src/routes/cycle.site-index.ts": entry,
    });

    const files = await collectRelevantFiles(server, [
      "./src/routes/cycle.site-index.ts",
    ]);

    expect(files).toEqual(
      new Set([
        "/repo/src/routes/cycle.site-index.ts",
        "/repo/src/content/a.ts",
        "/repo/src/content/b.ts",
      ]),
    );
  });
});
