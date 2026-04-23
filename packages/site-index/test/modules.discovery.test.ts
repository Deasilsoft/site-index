import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Module } from "../src/domains/site-indexes/types.js";
import { main, type ModuleLoader } from "../src/index.js";
import { writeFiles } from "./helpers/fs.js";
import { cleanupTempProjects, createTempProject } from "./helpers/project.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await cleanupTempProjects(tempRoots);
});

describe("modules discovery", () => {
  it("returns warning when no modules are found", async () => {
    const root = await createTempProject(tempRoots);
    const loadModule = vi.fn<ModuleLoader>(async () => ({
      siteIndexes: [],
    }));

    const result = await main({
      siteUrl: "https://example.com",
      rootPath: root,
      loadModule,
    });

    expect(result).toEqual({
      data: [],
      warnings: [{ message: `No modules found in: ${root}` }],
    });
    expect(loadModule).not.toHaveBeenCalled();
  });

  it("passes discovered modules correctly to loadModule", async () => {
    const root = await createTempProject(tempRoots);

    await writeFiles(root, [
      "z.site-index.ts",
      "nested/a.site-index.mjs",
      "nested/ignore.txt",
      "dist/ignore.site-index.ts",
      "node_modules/pkg/ignore.site-index.ts",
    ]);

    const receivedModules: Module[] = [];
    const loadModule: ModuleLoader = async (module) => {
      receivedModules.push(module);

      return { siteIndexes: [] };
    };

    await main({
      siteUrl: "https://example.com",
      rootPath: root,
      loadModule,
    });

    expect(receivedModules).toEqual([
      {
        filePath: path.join(root, "nested", "a.site-index.mjs"),
        importId: "./nested/a.site-index.mjs",
      },
      {
        filePath: path.join(root, "z.site-index.ts"),
        importId: "./z.site-index.ts",
      },
    ]);

    for (const module of receivedModules) {
      expect(path.isAbsolute(module.filePath)).toBe(true);
      expect(module.importId.startsWith("./")).toBe(true);
      expect(module.importId.includes("\\")).toBe(false);
    }
  });
});
