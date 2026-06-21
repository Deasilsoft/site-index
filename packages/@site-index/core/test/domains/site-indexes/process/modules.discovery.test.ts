import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type LoadModule, main, type Module } from "../../../../src/index.js";
import { writeFiles } from "../../../helpers/fs.js";
import {
  cleanupTempProjects,
  createTempProject,
} from "../../../helpers/project.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await cleanupTempProjects(tempRoots);
});

describe("modules discovery", () => {
  it("returns a warning and skips loading when no modules are found", async () => {
    const root = await createTempProject(tempRoots);
    const loadModule = vi.fn<LoadModule>(async () => ({
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

    expect(Object.isFrozen(result.data)).toBe(true);
    expect(loadModule).not.toHaveBeenCalled();
  });

  it("loads discovered modules with normalized import ids", async () => {
    const root = await createTempProject(tempRoots);

    await writeFiles(root, [
      "z.site-index.ts",
      "nested/a.site-index.mjs",
      "nested/ignore.txt",
      "dist/ignore.site-index.ts",
      "node_modules/pkg/ignore.site-index.ts",
    ]);

    const receivedModules: Module[] = [];
    const loadModule: LoadModule = async (module) => {
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
