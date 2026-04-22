import { afterEach, describe, expect, it } from "vitest";
import { runSiteIndexPipeline, type ModuleLoader } from "../src/index.js";
import { artifactMap } from "./helpers/artifacts.js";
import { writeFiles } from "./helpers/fs.js";
import { createLoadedModules } from "./helpers/modules.js";
import { cleanupTempProjects, createTempProject } from "./helpers/project.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await cleanupTempProjects(tempRoots);
});

describe("runSiteIndexPipeline artifacts", () => {
  it("builds artifacts from discovered modules", async () => {
    const root = await createTempProject(tempRoots);

    await writeFiles(root, [
      "about.site-index.ts",
      "blog.site-index.ts",
      "private.site-index.ts",
    ]);

    const loadModules: ModuleLoader = async (modules) => {
      const byImportId = new Map<string, unknown>([
        ["./about.site-index.ts", { default: [{ url: "/about" }] }],
        [
          "./blog.site-index.ts",
          {
            default: [
              {
                url: "/blog/first-post",
                sitemap: "blog",
                lastModified: "2026-04-22T10:15:00.000Z",
              },
              { url: "/blog/second-post", sitemap: "blog" },
            ],
          },
        ],
        [
          "./private.site-index.ts",
          { default: [{ url: "/admin", index: false }] },
        ],
      ]);

      return {
        data: createLoadedModules(modules, byImportId),
        warnings: [],
      };
    };

    const result = await runSiteIndexPipeline({
      siteUrl: "https://example.com",
      rootPath: root,
      loadModules,
    });

    expect(result.warnings).toEqual([]);

    const artifacts = artifactMap(result.data);
    expect([...artifacts.keys()].sort()).toEqual([
      "/robots.txt",
      "/sitemap-blog.xml",
      "/sitemap-pages.xml",
      "/sitemap.xml",
    ]);

    const robots = artifacts.get("/robots.txt");
    expect(robots).toContain("Disallow: /admin");
    expect(robots).toContain("Sitemap: https://example.com/sitemap.xml");

    const sitemapBlog = artifacts.get("/sitemap-blog.xml");
    expect(sitemapBlog).toContain("https://example.com/blog/first-post");
    expect(sitemapBlog).toContain("https://example.com/blog/second-post");
    expect(sitemapBlog).toContain(
      "<lastmod>2026-04-22T10:15:00.000Z</lastmod>",
    );

    const sitemapPages = artifacts.get("/sitemap-pages.xml");
    expect(sitemapPages).toContain("https://example.com/about");
    expect(sitemapPages).not.toContain("https://example.com/admin");
  });

  it("applies defaults and keeps output stable", async () => {
    const root = await createTempProject(tempRoots);

    await writeFiles(root, ["a.site-index.ts", "b.site-index.ts"]);

    const loadModules: ModuleLoader = async (modules) => {
      const byImportId = new Map<string, unknown>([
        [
          "./a.site-index.ts",
          {
            default: [
              { url: "/z-last" },
              { url: "/private-b", index: false },
              { url: "/private-a", index: false },
              { url: "/blog-one", sitemap: "blog" },
            ],
          },
        ],
        ["./b.site-index.ts", { default: [{ url: "/a-first" }] }],
      ]);

      return {
        data: createLoadedModules(modules, byImportId),
        warnings: [],
      };
    };

    const result = await runSiteIndexPipeline({
      siteUrl: "https://example.com",
      rootPath: root,
      loadModules,
    });

    expect(result.warnings).toEqual([]);
    expect(result.data.map((artifact) => artifact.filePath)).toEqual([
      "/sitemap-blog.xml",
      "/sitemap-pages.xml",
      "/sitemap.xml",
      "/robots.txt",
    ]);

    const artifacts = artifactMap(result.data);

    const sitemapPages = artifacts.get("/sitemap-pages.xml");
    expect(sitemapPages).toContain("https://example.com/a-first");
    expect(sitemapPages).toContain("https://example.com/z-last");

    const robots = artifacts.get("/robots.txt");
    expect(robots).toContain("Disallow: /private-a");
    expect(robots).toContain("Disallow: /private-b");
    expect(robots?.indexOf("Disallow: /private-a")).toBeLessThan(
      robots?.indexOf("Disallow: /private-b") ?? 0,
    );
  });
});
