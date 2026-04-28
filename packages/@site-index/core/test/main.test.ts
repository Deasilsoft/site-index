import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { main, type ModuleLoader } from "../src/index.js";
import { writeFiles } from "./helpers/fs.js";
import { cleanupTempProjects, createTempProject } from "./helpers/project.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await cleanupTempProjects(tempRoots);
});

describe("main", () => {
  it("collects warnings from module loading and validation", async () => {
    const root = await createTempProject(tempRoots);

    await writeFiles(root, [
      "good-a.site-index.ts",
      "good-b.site-index.ts",
      "bad.site-index.ts",
      "throws.site-index.ts",
    ]);

    const loadModule: ModuleLoader = async (module) => {
      const byImportId = new Map<string, unknown>([
        ["./good-a.site-index.ts", { siteIndexes: [{ url: "/about" }] }],
        ["./good-b.site-index.ts", { siteIndexes: [{ url: "/about" }] }],
        ["./bad.site-index.ts", { siteIndexes: [{ url: "not-valid" }] }],
      ]);

      if (module.importId === "./throws.site-index.ts") {
        throw new Error("Loader warning");
      }

      return (byImportId.get(module.importId) ?? {
        siteIndexes: [],
      }) as Awaited<ReturnType<ModuleLoader>>;
    };

    const result = await main({
      siteUrl: "https://example.com",
      rootPath: root,
      loadModule,
    });

    expect(result.warnings).toHaveLength(3);
    expect(result.warnings.map((warning) => warning.message)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          `Failed to load module "${path.join(root, "throws.site-index.ts")}"`,
        ),
        expect.stringContaining("Loader warning"),
        expect.stringContaining("Invalid module"),
        expect.stringContaining('Duplicate URL "/about"'),
      ]),
    );
    expect(result.data.map((artifact) => artifact.filePath)).toEqual(
      expect.arrayContaining([
        "robots.txt",
        "sitemap-pages.xml",
        "sitemap.xml",
      ]),
    );
  });
});
