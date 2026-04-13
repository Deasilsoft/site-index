import type { Artifact } from "@/domains/artifacts";
import type { SiteIndexes } from "@/domains/site-indexes";
import { describe, expect, it, vi } from "vitest";
import { pipeline } from "./pipeline.js";
import type { SiteIndexesSource } from "./types.js";

describe("pipeline", () => {
  const config = { siteUrl: "https://example.com" };

  function createSource(
    siteIndexes: SiteIndexes,
    warnings: string[] = [],
  ): SiteIndexesSource {
    return {
      loadSiteIndexes: vi.fn().mockResolvedValue({ siteIndexes, warnings }),
    };
  }

  it("throws on duplicate urls", async () => {
    const source = createSource([
      { url: "/about" },
      { url: "/about", sitemap: "blog" },
    ]);

    await expect(pipeline(config, source)).rejects.toThrow(
      "Duplicate url: /about",
    );
  });

  it("defaults missing index to true and disallows only index:false urls", async () => {
    const source = createSource([
      { url: "/public" },
      { url: "/admin", index: false },
      { url: "/private", index: false },
    ]);

    const { artifacts } = await pipeline(config, source);
    const robots = artifacts.find((a: Artifact) => a.path === "/robots.txt");
    const sitemapPages = artifacts.find(
      (a: Artifact) => a.path === "/sitemap-pages.xml",
    );

    expect(sitemapPages?.content).toContain(
      "<loc>https://example.com/public</loc>",
    );
    expect(robots?.content).toContain("Disallow: /admin");
    expect(robots?.content).toContain("Disallow: /private");
    expect(robots?.content).not.toContain("Disallow: /public");
  });

  it("generates empty sitemaps when no modules found", async () => {
    const source = createSource(
      [],
      ["No site-index modules found under Vite root: /repo"],
    );

    const { artifacts, warnings } = await pipeline(config, source);

    expect(artifacts).toHaveLength(2);
    expect(artifacts[0]?.path).toBe("/sitemap.xml");
    expect(artifacts[1]?.path).toBe("/robots.txt");
    expect(warnings).toContain(
      "No site-index modules found under Vite root: /repo",
    );
  });
});
