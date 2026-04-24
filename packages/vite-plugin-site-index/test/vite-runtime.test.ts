import { describe, expect, it, vi } from "vitest";
import { makeTrackingModuleLoader } from "../src/shared/vite-runtime.js";

describe("makeTrackingModuleLoader", () => {
  it("tracks the exact module.importId values requested by SiteIndex.main", async () => {
    const ssrLoadModule = vi
      .fn()
      .mockResolvedValueOnce({ default: { siteIndexes: [{ url: "/a" }] } })
      .mockResolvedValueOnce({ default: { siteIndexes: [{ url: "/b" }] } });
    const server = {
      ssrLoadModule,
    } as never;

    const { loadModule, loadedImportIds } = makeTrackingModuleLoader(server);

    await loadModule({
      filePath: "/repo/src/routes/a.site-index.ts",
      importId: "./src/routes/a.site-index.ts",
    });
    await loadModule({
      filePath: "/repo/src/routes/b.site-index.ts",
      importId: "@/routes/b.site-index.ts",
    });

    expect(ssrLoadModule).toHaveBeenNthCalledWith(
      1,
      "./src/routes/a.site-index.ts",
    );
    expect(ssrLoadModule).toHaveBeenNthCalledWith(
      2,
      "@/routes/b.site-index.ts",
    );
    expect(loadedImportIds).toEqual(
      new Set(["./src/routes/a.site-index.ts", "@/routes/b.site-index.ts"]),
    );
  });

  it("returns the default export from ssrLoadModule", async () => {
    const loaded = { siteIndexes: [{ url: "/news" }] };
    const server = {
      ssrLoadModule: vi.fn().mockResolvedValue({ default: loaded }),
    } as never;

    const { loadModule } = makeTrackingModuleLoader(server);
    const exports = await loadModule({
      filePath: "/repo/src/routes/news.site-index.ts",
      importId: "./src/routes/news.site-index.ts",
    });

    expect(exports).toBe(loaded);
  });
});
