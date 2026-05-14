import { afterEach, describe, expect, it } from "vitest";
import { type Artifact, type LoadModule, main } from "../../../src/index.js";
import { writeFiles } from "../../helpers/fs.js";
import {
  cleanupTempProjects,
  createTempProject,
} from "../../helpers/project.js";

const tempRoots: string[] = [];
const CANONICAL_SITEMAP_NAMESPACE =
  'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
const INVALID_SITEMAP_NAMESPACE =
  'xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"';

const DEFAULT_ARTIFACTS_BY_IMPORT_ID = new Map<string, unknown>([
  ["./about.site-index.ts", { siteIndexes: [{ url: "/about" }] }],
  [
    "./blog.site-index.ts",
    {
      siteIndexes: [
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
    { siteIndexes: [{ url: "/admin", index: false }] },
  ],
]);

const STABLE_ARTIFACTS_BY_IMPORT_ID = new Map<string, unknown>([
  [
    "./a.site-index.ts",
    {
      siteIndexes: [
        { url: "/z-last" },
        { url: "/private-b", index: false },
        { url: "/private-a", index: false },
        { url: "/blog-one", sitemap: "blog" },
      ],
    },
  ],
  ["./b.site-index.ts", { siteIndexes: [{ url: "/a-first" }] }],
]);

const loadDefaultArtifactsModule: LoadModule = async (module) =>
  (DEFAULT_ARTIFACTS_BY_IMPORT_ID.get(module.importId) ?? {
    siteIndexes: [],
  }) as Awaited<ReturnType<LoadModule>>;

const loadStableArtifactsModule: LoadModule = async (module) =>
  (STABLE_ARTIFACTS_BY_IMPORT_ID.get(module.importId) ?? {
    siteIndexes: [],
  }) as Awaited<ReturnType<LoadModule>>;

const loadModuleWithEscapedUrl: LoadModule = async () => ({
  siteIndexes: [{ url: "/a&b<c>d\"e'f" }],
});

function getArtifact(artifacts: Artifact[], filePath: string): Artifact {
  const artifact = artifacts.find((entry) => entry.filePath === filePath);

  if (artifact === undefined) {
    throw new Error(`Missing artifact: ${filePath}`);
  }

  return artifact;
}

afterEach(async () => {
  await cleanupTempProjects(tempRoots);
});

describe("generated artifacts", () => {
  it("builds sitemap and robots artifacts for indexed and non-indexed routes", async () => {
    const root = await createTempProject(tempRoots);

    await writeFiles(root, [
      "about.site-index.ts",
      "blog.site-index.ts",
      "private.site-index.ts",
    ]);

    const result = await main({
      siteUrl: "https://example.com",
      rootPath: root,
      loadModule: loadDefaultArtifactsModule,
    });

    expect(result.warnings).toHaveLength(0);
    expect(result.data.map((artifact) => artifact.filePath).toSorted()).toEqual(
      ["robots.txt", "sitemap-blog.xml", "sitemap-pages.xml", "sitemap.xml"],
    );

    const sitemapBlog = getArtifact(result.data, "sitemap-blog.xml");
    const sitemapPages = getArtifact(result.data, "sitemap-pages.xml");
    const sitemapIndex = getArtifact(result.data, "sitemap.xml");
    const robots = getArtifact(result.data, "robots.txt");

    expect(sitemapBlog.filePath).toBe("sitemap-blog.xml");
    expect(sitemapBlog.contentType).toBe("application/xml; charset=utf-8");
    expect(sitemapBlog.content).toContain(CANONICAL_SITEMAP_NAMESPACE);
    expect(sitemapBlog.content).not.toContain(INVALID_SITEMAP_NAMESPACE);
    await expect(sitemapBlog.content).toMatchFileSnapshot(
      "./snapshots/sitemap-blog.default.xml",
    );

    expect(sitemapPages.filePath).toBe("sitemap-pages.xml");
    expect(sitemapPages.contentType).toBe("application/xml; charset=utf-8");
    expect(sitemapPages.content).toContain(CANONICAL_SITEMAP_NAMESPACE);
    expect(sitemapPages.content).not.toContain(INVALID_SITEMAP_NAMESPACE);
    await expect(sitemapPages.content).toMatchFileSnapshot(
      "./snapshots/sitemap-pages.default.xml",
    );

    expect(sitemapIndex.filePath).toBe("sitemap.xml");
    expect(sitemapIndex.contentType).toBe("application/xml; charset=utf-8");
    expect(sitemapIndex.content).toContain(CANONICAL_SITEMAP_NAMESPACE);
    expect(sitemapIndex.content).not.toContain(INVALID_SITEMAP_NAMESPACE);
    await expect(sitemapIndex.content).toMatchFileSnapshot(
      "./snapshots/sitemap-index.default.xml",
    );

    expect(robots.filePath).toBe("robots.txt");
    expect(robots.contentType).toBe("text/plain; charset=utf-8");
    await expect(robots.content).toMatchFileSnapshot(
      "./snapshots/robots.with-private-routes.txt",
    );
  });

  it("keeps artifact ordering and disallow list deterministic", async () => {
    const root = await createTempProject(tempRoots);

    await writeFiles(root, ["a.site-index.ts", "b.site-index.ts"]);

    const result = await main({
      siteUrl: "https://example.com",
      rootPath: root,
      loadModule: loadStableArtifactsModule,
    });

    expect(result.warnings).toHaveLength(0);
    expect(result.data.map((artifact) => artifact.filePath)).toEqual([
      "sitemap-blog.xml",
      "sitemap-pages.xml",
      "sitemap.xml",
      "robots.txt",
    ]);

    const sitemapPages = getArtifact(result.data, "sitemap-pages.xml");
    const robots = getArtifact(result.data, "robots.txt");

    expect(sitemapPages.filePath).toBe("sitemap-pages.xml");
    expect(sitemapPages.contentType).toBe("application/xml; charset=utf-8");
    expect(sitemapPages.content).toContain("https://example.com/a-first");
    expect(sitemapPages.content).toContain("https://example.com/z-last");

    expect(robots.filePath).toBe("robots.txt");
    expect(robots.contentType).toBe("text/plain; charset=utf-8");
    await expect(robots.content).toMatchFileSnapshot(
      "./snapshots/robots.sorted-disallow.txt",
    );
  });

  it("escapes XML-sensitive URL characters in sitemap output", async () => {
    const root = await createTempProject(tempRoots);

    await writeFiles(root, ["special.site-index.ts"]);

    const result = await main({
      siteUrl: "https://example.com",
      rootPath: root,
      loadModule: loadModuleWithEscapedUrl,
    });

    expect(result.warnings).toHaveLength(0);

    const sitemapPages = getArtifact(result.data, "sitemap-pages.xml");

    expect(sitemapPages.filePath).toBe("sitemap-pages.xml");
    expect(sitemapPages.contentType).toBe("application/xml; charset=utf-8");
    await expect(sitemapPages.content).toMatchFileSnapshot(
      "./snapshots/sitemap-pages.escaped-url.xml",
    );

    expect(sitemapPages.content).toContain(
      "https://example.com/a&amp;b&lt;c&gt;d&quot;e&apos;f",
    );
  });
});
