import { describe, expect, it } from "vitest";
import type { ResolvedModule } from "../src/domains/site-indexes/modules.schema.js";
import { resolveSiteIndexes } from "../src/domains/site-indexes/site-indexes.resolve.js";
import type { ResolvedSiteIndex } from "../src/domains/site-indexes/site-indexes.schema.js";

const testRoot = "/test-fixtures";

function createResolvedModule(
  fileName: string,
  siteIndexes: Partial<ResolvedSiteIndex>[],
): ResolvedModule {
  return {
    filePath: `${testRoot}/${fileName}`,
    importId: `./${fileName}`,
    siteIndexes: siteIndexes.map((siteIndex) => ({
      sitemap: "pages",
      index: true,
      ...siteIndex,
    })) as ResolvedSiteIndex[],
  };
}

describe("site-indexes resolve", () => {
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

    const result = resolveSiteIndexes(resolvedModules);

    expect(result.data).toEqual([
      {
        url: "/blog/first-post",
        sitemap: "blog",
        index: true,
        lastModified: "2026-04-08T09:00:00.000Z",
        filePath: "/test-fixtures/blog.site-index.ts",
      },
      {
        url: "/blog/hello-world",
        sitemap: "blog",
        index: true,
        lastModified: "2026-04-10T12:00:00.000Z",
        filePath: "/test-fixtures/blog.site-index.ts",
      },
      {
        url: "/about",
        sitemap: "pages",
        index: true,
        filePath: "/test-fixtures/about.site-index.ts",
      },
      {
        url: "/admin",
        sitemap: "pages",
        index: false,
        filePath: "/test-fixtures/private.site-index.ts",
      },
    ]);
    expect(result.warnings).toEqual([
      {
        message:
          'Duplicate URL "/about" found in "/test-fixtures/about.site-index.ts"',
        filePath: "/test-fixtures/duplicate-about.site-index.ts",
      },
    ]);
  });

  it("preserves lastModified while applying defaults", () => {
    const modules = [
      createResolvedModule("a.site-index.ts", [
        {
          url: "/about",
          lastModified: "2026-01-01T00:00:00Z",
        },
      ]),
    ];
    const before = structuredClone(modules);
    const result = resolveSiteIndexes(modules);

    expect(result).toEqual({
      data: [
        {
          url: "/about",
          lastModified: "2026-01-01T00:00:00Z",
          sitemap: "pages",
          index: true,
          filePath: "/test-fixtures/a.site-index.ts",
        },
      ],
      warnings: [],
    });
    expect(modules).toEqual(before);
  });

  it("keeps first duplicate URL within the same module", () => {
    const result = resolveSiteIndexes([
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
        filePath: "/test-fixtures/duplicates.site-index.ts",
      },
    ]);
    expect(result.warnings).toEqual([
      {
        message:
          'Duplicate URL "/about" found in "/test-fixtures/duplicates.site-index.ts"',
        filePath: "/test-fixtures/duplicates.site-index.ts",
      },
    ]);
  });

  it("returns empty data and warnings for empty input", () => {
    const first = resolveSiteIndexes([]);
    const second = resolveSiteIndexes([]);

    expect(first).toEqual({ data: [], warnings: [] });
    expect(second).toEqual({ data: [], warnings: [] });
    expect(first.data).not.toBe(second.data);
    expect(first.warnings).not.toBe(second.warnings);
  });
});
