import { describe, expect, it } from "vitest";
import { loadModules } from "../../../../src/domains/site-indexes/process/modules.load.js";
import type { LoadModule, Module } from "../../../../src/index.js";

function createModule(fileName: string): Module {
  return {
    filePath: `/repo/${fileName}`,
    importId: `./${fileName}`,
  };
}

function throwValue(value: unknown): never {
  throw value;
}

const loadSuccessfulModules: LoadModule = async (module) => ({
  siteIndexes: [
    {
      url: module.importId === "./about.site-index.ts" ? "/about" : "/blog",
    },
  ],
});

const loadModulesWithMixedFailures: LoadModule = async (module) => {
  if (module.importId === "./throws-error.site-index.ts") {
    throw new Error("loader exploded");
  }

  if (module.importId === "./throws-string.site-index.ts") {
    throwValue("loader failed");
  }

  return { siteIndexes: [{ url: "/ok" }] };
};

describe("loadModules", () => {
  it("loads modules and preserves module metadata", async () => {
    const modules = [
      createModule("about.site-index.ts"),
      createModule("blog.site-index.ts"),
    ];

    await expect(loadModules(modules, loadSuccessfulModules)).resolves.toEqual({
      data: [
        {
          filePath: "/repo/about.site-index.ts",
          importId: "./about.site-index.ts",
          siteIndexes: [{ url: "/about" }],
        },
        {
          filePath: "/repo/blog.site-index.ts",
          importId: "./blog.site-index.ts",
          siteIndexes: [{ url: "/blog" }],
        },
      ],
      warnings: [],
    });
  });

  it("keeps successful loads while warning for Error and non-Error throws", async () => {
    const modules = [
      createModule("good.site-index.ts"),
      createModule("throws-error.site-index.ts"),
      createModule("throws-string.site-index.ts"),
    ];

    const result = await loadModules(modules, loadModulesWithMixedFailures);

    expect(result.data).toEqual([
      {
        filePath: "/repo/good.site-index.ts",
        importId: "./good.site-index.ts",
        siteIndexes: [{ url: "/ok" }],
      },
    ]);

    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0]).toEqual({
      filePath: "/repo/throws-error.site-index.ts",
      message:
        'Failed to load module "/repo/throws-error.site-index.ts" (./throws-error.site-index.ts): loader exploded',
    });

    expect(result.warnings[1]).toEqual({
      filePath: "/repo/throws-string.site-index.ts",
      message:
        'Failed to load module "/repo/throws-string.site-index.ts" (./throws-string.site-index.ts): loader failed',
    });
  });
});
