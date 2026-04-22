import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  runSiteIndexPipeline,
  type Module,
  type ModuleLoader,
} from "../src/index.js";
import { cleanupTempProjects, createTempProject } from "./helpers/project.js";
import { writeFiles } from "./helpers/fs.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await cleanupTempProjects(tempRoots);
});

describe("runSiteIndexPipeline discovery", () => {
  it("returns warning when no modules are found", async () => {
    const root = await createTempProject(tempRoots);
    const loadModules = vi.fn<ModuleLoader>(async () => ({
      data: [],
      warnings: [],
    }));

    const result = await runSiteIndexPipeline({
      siteUrl: "https://example.com",
      rootPath: root,
      loadModules,
    });

    expect(result).toEqual({
      data: [],
      warnings: [{ message: `No modules found in: ${root}` }],
    });
    expect(loadModules).not.toHaveBeenCalled();
  });

  it("passes discovered modules correctly to loadModules", async () => {
    const root = await createTempProject(tempRoots);

    await writeFiles(root, [
      "z.site-index.ts",
      "nested/a.site-index.mjs",
      "nested/ignore.txt",
      "dist/ignore.site-index.ts",
      "node_modules/pkg/ignore.site-index.ts",
    ]);

    let receivedModules: Module[] = [];
    const loadModules: ModuleLoader = async (modules) => {
      receivedModules = modules;
      return { data: [], warnings: [] };
    };

    await runSiteIndexPipeline({
      siteUrl: "https://example.com",
      rootPath: root,
      loadModules,
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
