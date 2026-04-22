import { describe, expect, it } from "vitest";
import { type LoadedModule, validateModules } from "../src/index.js";

const testRoot = "/test-fixtures";

function createLoadedModule(
  fileName: string,
  exportsValue: unknown,
): LoadedModule {
  const filePath = `${testRoot}/${fileName}`;

  return {
    module: {
      filePath,
      importId: `./${fileName}`,
    },
    exports: exportsValue as LoadedModule["exports"],
  };
}

describe("validateModules", () => {
  it("returns resolved modules for valid default exports", () => {
    const loadedModules: LoadedModule[] = [
      createLoadedModule("about.site-index.ts", {
        default: [{ url: "/about" }],
      }),
      createLoadedModule("blog.site-index.ts", {
        default: [
          {
            url: "/blog/hello-world",
            sitemap: "blog",
            lastModified: "2026-04-10T12:00:00.000Z",
          },
        ],
      }),
      createLoadedModule("private.site-index.ts", {
        default: [{ url: "/admin", index: false }],
      }),
    ];

    const result = validateModules(loadedModules);

    expect(result.warnings).toEqual([]);
    expect(result.data).toEqual([
      {
        module: {
          filePath: "/test-fixtures/about.site-index.ts",
          importId: "./about.site-index.ts",
        },
        siteIndexes: [{ url: "/about" }],
      },
      {
        module: {
          filePath: "/test-fixtures/blog.site-index.ts",
          importId: "./blog.site-index.ts",
        },
        siteIndexes: [
          {
            url: "/blog/hello-world",
            sitemap: "blog",
            lastModified: "2026-04-10T12:00:00.000Z",
          },
        ],
      },
      {
        module: {
          filePath: "/test-fixtures/private.site-index.ts",
          importId: "./private.site-index.ts",
        },
        siteIndexes: [{ url: "/admin", index: false }],
      },
    ]);
  });

  it("keeps valid modules and skips invalid ones in the same run", () => {
    const loadedModules: LoadedModule[] = [
      createLoadedModule("valid.site-index.ts", {
        default: [{ url: "/valid" }],
      }),
      createLoadedModule("bad.site-index.ts", {
        default: [
          {
            url: "about",
          },
        ],
      }),
    ];

    const result = validateModules(loadedModules);

    expect(result.data).toEqual([
      {
        module: {
          filePath: "/test-fixtures/valid.site-index.ts",
          importId: "./valid.site-index.ts",
        },
        siteIndexes: [{ url: "/valid" }],
      },
    ]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatchObject({
      filePath: "/test-fixtures/bad.site-index.ts",
    });
    expect(result.warnings[0]?.message).toContain(
      "Invalid site index module exports",
    );
  });

  it.each([
    ["missing default export", {}],
    ["non-array default export", { default: { url: "/about" } }],
    ["extra key in site index", { default: [{ url: "/about", extra: true }] }],
    ["invalid sitemap name", { default: [{ url: "/about", sitemap: "Blog" }] }],
  ])("warns for invalid export shape: %s", (_name, exportsValue) => {
    const result = validateModules([
      createLoadedModule("invalid.site-index.ts", exportsValue),
    ]);

    expect(result.data).toEqual([]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatchObject({
      filePath: "/test-fixtures/invalid.site-index.ts",
    });
  });

  it("returns empty data and warnings for empty input", () => {
    expect(validateModules([])).toEqual({ data: [], warnings: [] });
  });
});
