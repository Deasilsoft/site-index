import { describe, expect, it } from "vitest";
import { resolveModules } from "../src/domains/site-indexes/modules.resolve.js";
import type { LoadedModule } from "../src/domains/site-indexes/types.js";
import type { SiteIndex } from "../src/index.js";

const testRoot = "/test-fixtures";

function createLoadedModule(
  fileName: string,
  siteIndexes: SiteIndex[] | unknown,
): LoadedModule {
  const filePath = `${testRoot}/${fileName}`;

  return {
    filePath,
    importId: `./${fileName}`,
    siteIndexes: siteIndexes as SiteIndex[],
  };
}

describe("validateModules", () => {
  it("returns resolved modules for valid default exports", () => {
    const loadedModules: LoadedModule[] = [
      createLoadedModule("about.site-index.ts", [{ url: "/about" }]),
      createLoadedModule("blog.site-index.ts", [
        {
          url: "/blog/hello-world",
          sitemap: "blog",
          lastModified: "2026-04-10T12:00:00.000Z",
        },
      ]),
      createLoadedModule("private.site-index.ts", [
        { url: "/admin", index: false },
      ]),
    ];

    const result = resolveModules(loadedModules);

    expect(result.warnings).toEqual([]);
    expect(result.data).toEqual([
      {
        filePath: "/test-fixtures/about.site-index.ts",
        importId: "./about.site-index.ts",
        siteIndexes: [{ url: "/about", sitemap: "pages", index: true }],
      },
      {
        filePath: "/test-fixtures/blog.site-index.ts",
        importId: "./blog.site-index.ts",
        siteIndexes: [
          {
            url: "/blog/hello-world",
            sitemap: "blog",
            index: true,
            lastModified: "2026-04-10T12:00:00.000Z",
          },
        ],
      },
      {
        filePath: "/test-fixtures/private.site-index.ts",
        importId: "./private.site-index.ts",
        siteIndexes: [{ url: "/admin", sitemap: "pages", index: false }],
      },
    ]);
  });

  it("keeps valid modules and skips invalid ones in the same run", () => {
    const loadedModules: LoadedModule[] = [
      createLoadedModule("valid.site-index.ts", [{ url: "/valid" }]),
      createLoadedModule("bad.site-index.ts", [
        {
          url: "about",
        },
      ]),
    ];

    const result = resolveModules(loadedModules);

    expect(result.data).toEqual([
      {
        filePath: "/test-fixtures/valid.site-index.ts",
        importId: "./valid.site-index.ts",
        siteIndexes: [{ url: "/valid", sitemap: "pages", index: true }],
      },
    ]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatchObject({
      filePath: "/test-fixtures/bad.site-index.ts",
    });
    expect(result.warnings[0]?.message).toContain("Invalid module");
    expect(result.warnings[0]?.message).toContain("Invalid url");
  });

  it.each([
    ["missing siteIndexes export", undefined, "siteIndexes"],
    ["non-array siteIndexes export", { url: "/about" }, "expected array"],
    [
      "extra key in site index",
      [{ url: "/about", extra: true }],
      "Unrecognized key",
    ],
    [
      "invalid sitemap name",
      [{ url: "/about", sitemap: "Blog" }],
      "Invalid sitemap name",
    ],
    ["invalid url shape", [{ url: "about" }], "Invalid url"],
    [
      "invalid lastModified date",
      [{ url: "/about", lastModified: "2026-04-99" }],
      "Invalid ISO date",
    ],
    [
      "invalid lastModified datetime without offset",
      [{ url: "/about", lastModified: "2026-04-10T12:00:00" }],
      "Invalid ISO datetime",
    ],
    [
      "invalid lastModified nonsense",
      [{ url: "/about", lastModified: "yesterday" }],
      "Invalid input",
    ],
  ])(
    "warns for invalid export shape: %s",
    (_name, siteIndexes, expectedDetail) => {
      const result = resolveModules([
        createLoadedModule("invalid.site-index.ts", siteIndexes),
      ]);

      expect(result.data).toEqual([]);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toMatchObject({
        filePath: "/test-fixtures/invalid.site-index.ts",
      });
      expect(result.warnings[0]?.message).toContain("Invalid module");
      expect(result.warnings[0]?.message).toContain(expectedDetail);
    },
  );

  it.each([
    "2026-04-10",
    "2026-04-10T12:00:00Z",
    "2026-04-10T12:00:00.000Z",
    "2026-04-10T12:00:00+02:00",
  ])("accepts valid lastModified value: %s", (lastModified) => {
    const result = resolveModules([
      createLoadedModule("valid.site-index.ts", [
        { url: "/about", lastModified },
      ]),
    ]);

    expect(result.warnings).toEqual([]);
    expect(result.data).toEqual([
      {
        filePath: "/test-fixtures/valid.site-index.ts",
        importId: "./valid.site-index.ts",
        siteIndexes: [
          {
            url: "/about",
            sitemap: "pages",
            index: true,
            lastModified,
          },
        ],
      },
    ]);
  });

  it("returns empty data and warnings for empty input", () => {
    const first = resolveModules([]);
    const second = resolveModules([]);

    expect(first).toEqual({ data: [], warnings: [] });
    expect(second).toEqual({ data: [], warnings: [] });
    expect(first.data).not.toBe(second.data);
    expect(first.warnings).not.toBe(second.warnings);
  });
});
