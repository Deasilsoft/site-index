import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSiteIndexesSource } from "./source.js";
import type { SiteIndexModule } from "./types.js";

const { loadSiteIndexRegistryMock } = vi.hoisted(() => ({
  loadSiteIndexRegistryMock: vi.fn(),
}));

vi.mock("./loader.js", () => ({
  loadSiteIndexRegistry: loadSiteIndexRegistryMock,
}));

describe("createSiteIndexesSource", () => {
  beforeEach(() => {
    loadSiteIndexRegistryMock.mockReset();
  });

  it("flattens siteIndexes from all loaded modules", async () => {
    loadSiteIndexRegistryMock.mockResolvedValueOnce({
      registry: {
        "./about.site-index.ts": { siteIndexes: [{ url: "/about" }] },
        "./blog.site-index.ts": { siteIndexes: [{ url: "/blog" }] },
      },
      warnings: [],
    });

    const source = createSiteIndexesSource();
    const result = await source.loadSiteIndexes();

    expect(result.siteIndexes).toEqual([{ url: "/about" }, { url: "/blog" }]);
    expect(result.warnings).toEqual([]);
  });

  it("throws a clear error when a module export is null", async () => {
    loadSiteIndexRegistryMock.mockResolvedValueOnce({
      registry: {
        "./null.site-index.ts": null as unknown as SiteIndexModule,
      },
      warnings: [],
    });

    const source = createSiteIndexesSource();

    await expect(source.loadSiteIndexes()).rejects.toThrow(
      "Module must export siteIndexes",
    );
  });

  it("throws when a module does not export siteIndexes", async () => {
    loadSiteIndexRegistryMock.mockResolvedValueOnce({
      registry: {
        "./bad.site-index.ts": {},
      },
      warnings: [],
    });

    const source = createSiteIndexesSource();

    await expect(source.loadSiteIndexes()).rejects.toThrow(
      "Module must export siteIndexes",
    );
  });
});
