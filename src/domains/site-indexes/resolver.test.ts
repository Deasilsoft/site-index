import { describe, expect, it, vi } from "vitest";
import { loadSiteIndexModule } from "./resolver.js";

describe("loadSiteIndexModule", () => {
  it("normalizes the file path before calling loadWithVite", async () => {
    const loadWithVite = vi.fn().mockResolvedValue({ siteIndexes: [] });

    await loadSiteIndexModule("/root//about.site-index.ts", loadWithVite);

    expect(loadWithVite).toHaveBeenCalledWith("/root/about.site-index.ts");
  });

  it("returns the module directly when siteIndexes is a named export", async () => {
    const loadWithVite = vi
      .fn()
      .mockResolvedValue({ siteIndexes: [{ url: "/about" }] });

    const result = await loadSiteIndexModule(
      "/about.site-index.ts",
      loadWithVite,
    );

    expect(result).toEqual({ siteIndexes: [{ url: "/about" }] });
  });

  it("unwraps siteIndexes from a default export", async () => {
    const loadWithVite = vi.fn().mockResolvedValue({
      default: { siteIndexes: [{ url: "/about" }] },
    });

    const result = await loadSiteIndexModule(
      "/about.site-index.ts",
      loadWithVite,
    );

    expect(result).toEqual({ siteIndexes: [{ url: "/about" }] });
  });

  it("throws a clear error when the module is not an object", async () => {
    const loadWithVite = vi.fn().mockResolvedValue(null);

    await expect(
      loadSiteIndexModule("/bad.site-index.ts", loadWithVite),
    ).rejects.toThrow("Module must export siteIndexes");
  });

  it("passes through an object with no siteIndexes unchanged", async () => {
    const loadWithVite = vi.fn().mockResolvedValue({ unrelated: true });

    const result = await loadSiteIndexModule(
      "/bad.site-index.ts",
      loadWithVite,
    );

    expect(result).toEqual({ unrelated: true });
  });

  it("passes through a default object with no siteIndexes unchanged", async () => {
    const loadWithVite = vi.fn().mockResolvedValue({
      default: { unrelated: true },
    });

    const result = await loadSiteIndexModule(
      "/bad.site-index.ts",
      loadWithVite,
    );

    expect(result).toEqual({ default: { unrelated: true } });
  });
});
