import { describe, expect, it } from "vitest";
import { type ResolvedModule, validateSiteIndexes } from "../src/index.js";

const testRoot = "/test-fixtures";

function createResolvedModule(
  fileName: string,
  siteIndexes: ResolvedModule["siteIndexes"],
): ResolvedModule {
  return {
    module: {
      filePath: `${testRoot}/${fileName}`,
      importId: `./${fileName}`,
    },
    siteIndexes,
  };
}

describe("validateSiteIndexes", () => {
  it("applies defaults, sorts output, and deduplicates across modules", () => {
    const resolvedModules: ResolvedModule[] = [
      createResolvedModule("about.site-index.ts", [{ url: "/about" }]),
      createResolvedModule("blog.site-index.ts", [
        {
          url: "/blog/first-post",
          sitemap: "blog",
          lastModified: "2026-04-08T09:00:00.000Z",
        },
        {
          url: "/blog/hello-world",
          sitemap: "blog",
          lastModified: "2026-04-10T12:00:00.000Z",
        },
      ]),
      createResolvedModule("private.site-index.ts", [
        { url: "/admin", index: false },
      ]),
      createResolvedModule("duplicate-about.site-index.ts", [
        { url: "/about", sitemap: "blog" },
      ]),
    ];

    const result = validateSiteIndexes(resolvedModules);

    expect(result.data).toEqual([
      {
        url: "/blog/first-post",
        sitemap: "blog",
        index: true,
        lastModified: "2026-04-08T09:00:00.000Z",
      },
      {
        url: "/blog/hello-world",
        sitemap: "blog",
        index: true,
        lastModified: "2026-04-10T12:00:00.000Z",
      },
      { url: "/about", sitemap: "pages", index: true },
      { url: "/admin", sitemap: "pages", index: false },
    ]);
    expect(result.warnings).toEqual([
      {
        message:
          "Duplicate url ignored: /about (already defined in /test-fixtures/about.site-index.ts)",
        filePath: "/test-fixtures/duplicate-about.site-index.ts",
      },
    ]);
  });

  it("preserves lastModified while applying defaults", () => {
    const result = validateSiteIndexes([
      createResolvedModule("a.site-index.ts", [
        {
          url: "/about",
          lastModified: "2026-01-01T00:00:00Z",
        },
      ]),
    ]);

    expect(result).toEqual({
      data: [
        {
          url: "/about",
          lastModified: "2026-01-01T00:00:00Z",
          sitemap: "pages",
          index: true,
        },
      ],
      warnings: [],
    });
  });

  it("keeps first duplicate URL within the same module", () => {
    const result = validateSiteIndexes([
      createResolvedModule("duplicates.site-index.ts", [
        {
          url: "/about",
          sitemap: "pages",
          index: false,
          lastModified: "2026-01-01T00:00:00.000Z",
        },
        {
          url: "/about",
          sitemap: "blog",
          index: true,
          lastModified: "2026-02-01T00:00:00.000Z",
        },
      ]),
    ]);

    expect(result.data).toEqual([
      {
        url: "/about",
        sitemap: "pages",
        index: false,
        lastModified: "2026-01-01T00:00:00.000Z",
      },
    ]);
    expect(result.warnings).toEqual([
      {
        message:
          "Duplicate url ignored: /about (already defined in /test-fixtures/duplicates.site-index.ts)",
        filePath: "/test-fixtures/duplicates.site-index.ts",
      },
    ]);
  });

  it("returns empty data and warnings for empty input", () => {
    expect(validateSiteIndexes([])).toEqual({ data: [], warnings: [] });
  });
});
