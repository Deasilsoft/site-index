import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildArtifactsFromLoadedModules, type LoadModule, main } from "../src/index.js";
import { writeFiles } from "./helpers/fs.js";
import { cleanupTempProjects, createTempProject } from "./helpers/project.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await cleanupTempProjects(tempRoots);
});

describe("main", () => {
  it("collects warnings from module loading and validation", async () => {
    const root = await createTempProject(tempRoots);
    const throwsPath = path.join(root, "throws.site-index.ts");

    await writeFiles(root, [
      "good-a.site-index.ts",
      "good-b.site-index.ts",
      "bad.site-index.ts",
      "throws.site-index.ts",
    ]);

    const loadModule: LoadModule = async (module) => {
      if (module.importId === "./throws.site-index.ts") {
        throw new Error("Loader warning");
      }

      const byImportId = new Map<string, unknown>([
        ["./good-a.site-index.ts", { siteIndexes: [{ url: "/about" }] }],
        ["./good-b.site-index.ts", { siteIndexes: [{ url: "/about" }] }],
        ["./bad.site-index.ts", { siteIndexes: [{ url: "not-valid" }] }],
      ]);

      return (byImportId.get(module.importId) ?? {
        siteIndexes: [],
      }) as Awaited<ReturnType<LoadModule>>;
    };

    const result = await main({
      siteUrl: "https://example.com",
      rootPath: root,
      loadModule,
    });

    expect(result.warnings).toHaveLength(3);
    expect(result.warnings.map((warning) => warning.message)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`Failed to load module "${throwsPath}"`),
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

  it("builds artifacts from preloaded modules", () => {
    const result = buildArtifactsFromLoadedModules({
      siteUrl: "https://example.com",
      loadedModules: [
        {
          filePath: "/project/a.site-index.ts",
          importId: "./a.site-index.ts",
          siteIndexes: [{ url: "/a" }],
        },
        {
          filePath: "/project/b.site-index.ts",
          importId: "./b.site-index.ts",
          siteIndexes: [{ url: "/a" }],
        },
      ],
    });

    expect(
      result.warnings.some((warning) =>
        warning.message.includes('Duplicate URL "/a"'),
      ),
    ).toBe(true);

    expect(result.data.map((artifact) => artifact.filePath)).toEqual(
      expect.arrayContaining(["robots.txt", "sitemap-pages.xml", "sitemap.xml"]),
    );
  });

  it("builds artifacts from valid preloaded modules without warnings", () => {
    const result = buildArtifactsFromLoadedModules({
      siteUrl: "https://example.com",
      loadedModules: [
        {
          filePath: "/project/a.site-index.ts",
          importId: "./a.site-index.ts",
          siteIndexes: [{ url: "/a" }],
        },
        {
          filePath: "/project/b.site-index.ts",
          importId: "./b.site-index.ts",
          siteIndexes: [{ url: "/b" }],
        },
      ],
    });

    expect(result.warnings).toHaveLength(0);
    expect(result.data.map((artifact) => artifact.filePath)).toEqual(
      expect.arrayContaining(["robots.txt", "sitemap-pages.xml", "sitemap.xml"]),
    );
  });
});
