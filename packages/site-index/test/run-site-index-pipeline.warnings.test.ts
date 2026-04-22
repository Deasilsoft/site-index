import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runSiteIndexPipeline, type ModuleLoader } from "../src/index.js";
import { cleanupTempProjects, createTempProject } from "./helpers/project.js";
import { createLoadedModules } from "./helpers/modules.js";
import { writeFiles } from "./helpers/fs.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await cleanupTempProjects(tempRoots);
});

describe("runSiteIndexPipeline warnings", () => {
  it("collects warnings from module loading and validation", async () => {
    const root = await createTempProject(tempRoots);

    await writeFiles(root, [
      "good-a.site-index.ts",
      "good-b.site-index.ts",
      "bad.site-index.ts",
    ]);

    const loadModules: ModuleLoader = async (modules) => {
      const byImportId = new Map<string, unknown>([
        ["./good-a.site-index.ts", { default: [{ url: "/about" }] }],
        ["./good-b.site-index.ts", { default: [{ url: "/about" }] }],
        ["./bad.site-index.ts", { default: [{ url: "not-valid" }] }],
      ]);

      return {
        data: createLoadedModules(modules, byImportId),
        warnings: [
          {
            message: "Loader warning",
            filePath: path.join(root, "good-a.site-index.ts"),
          },
        ],
      };
    };

    const result = await runSiteIndexPipeline({
      siteUrl: "https://example.com",
      rootPath: root,
      loadModules,
    });

    expect(result.warnings).toHaveLength(3);
    expect(result.warnings.map((warning) => warning.message)).toEqual(
      expect.arrayContaining([
        "Loader warning",
        expect.stringContaining("Invalid site index module exports"),
        expect.stringContaining("Duplicate url ignored: /about"),
      ]),
    );
    expect(result.data.map((artifact) => artifact.filePath)).toEqual(
      expect.arrayContaining([
        "/robots.txt",
        "/sitemap-pages.xml",
        "/sitemap.xml",
      ]),
    );
  });
});
