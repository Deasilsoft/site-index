import { describe, expect, it, vi } from "vitest";
import { makeViteSiteIndexService } from "../src/main.js";

describe("makeViteSiteIndexService", () => {
  it("tracks the exact module.importId values requested by SiteIndex.main", async () => {
    const ssrLoadModule = vi
      .fn()
      .mockResolvedValueOnce({ default: { siteIndexes: [{ url: "/a" }] } })
      .mockResolvedValueOnce({ default: { siteIndexes: [{ url: "/b" }] } });
    const server = {
      ssrLoadModule,
    } as never;

    const service = makeViteSiteIndexService({ server });

    await service.loadModule({
      filePath: "/repo/src/routes/a.site-index.ts",
      importId: "./src/routes/a.site-index.ts",
    });
    await service.loadModule({
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
    expect(service.getLoadedModules()).toEqual([
      {
        filePath: "/repo/src/routes/a.site-index.ts",
        importId: "./src/routes/a.site-index.ts",
        siteIndexes: [{ url: "/a" }],
      },
      {
        filePath: "/repo/src/routes/b.site-index.ts",
        importId: "@/routes/b.site-index.ts",
        siteIndexes: [{ url: "/b" }],
      },
    ]);
  });

  it("returns the default export from ssrLoadModule", async () => {
    const loaded = { siteIndexes: [{ url: "/news" }] };
    const server = {
      ssrLoadModule: vi.fn().mockResolvedValue({ default: loaded }),
    } as never;

    const service = makeViteSiteIndexService({ server });
    const exports = await service.loadModule({
      filePath: "/repo/src/routes/news.site-index.ts",
      importId: "./src/routes/news.site-index.ts",
    });

    expect(exports).toBe(loaded);
  });
});
