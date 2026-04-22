import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { type LoadModule, runSiteIndexPipeline } from "../src/index.js";
import { writeFiles } from "./helpers/fs.js";
import { cleanupTempProjects, createTempProject } from "./helpers/project.js";

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
      "throws.site-index.ts",
    ]);

    const loadModule: LoadModule = async (module) => {
      const byImportId = new Map<string, unknown>([
        ["./good-a.site-index.ts", { default: [{ url: "/about" }] }],
        ["./good-b.site-index.ts", { default: [{ url: "/about" }] }],
        ["./bad.site-index.ts", { default: [{ url: "not-valid" }] }],
      ]);

      if (module.importId === "./throws.site-index.ts") {
        throw new Error("Loader warning");
      }

      return (byImportId.get(module.importId) ?? {
        default: [],
      }) as Awaited<ReturnType<LoadModule>>;
    };

    const result = await runSiteIndexPipeline({
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
