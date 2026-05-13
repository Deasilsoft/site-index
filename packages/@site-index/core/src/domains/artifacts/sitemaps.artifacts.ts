import type { ResolvedSiteIndex } from "../site-indexes/schemas/site-indexes.schema.js";
import { Artifact } from "./artifact.js";

const XML_VERSION_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
const SITEMAP_XML_NAMESPACE = "https://www.sitemaps.org/schemas/sitemap/0.9";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function renderSitemapXml(
  siteIndexes: ResolvedSiteIndex[],
  siteUrl: string,
): string {
  const lines: string[] = [
    XML_VERSION_DECLARATION,
    `<urlset xmlns="${SITEMAP_XML_NAMESPACE}">`,
  ];

  for (const siteIndex of siteIndexes) {
    const loc = escapeXml(`${siteUrl}${siteIndex.url}`);

    lines.push("  <url>", `    <loc>${loc}</loc>`);

    if (siteIndex.lastModified) {
      const lastmod = escapeXml(siteIndex.lastModified);

      lines.push(`    <lastmod>${lastmod}</lastmod>`);
    }

    lines.push("  </url>");
  }

  lines.push("</urlset>");

  return lines.join("\n");
}

export function makeSitemapArtifacts(
  sitemaps: Map<string, ResolvedSiteIndex[]>,
  siteUrl: string,
): Artifact[] {
  const sortedSitemaps = [...sitemaps.entries()].toSorted(([a], [b]) =>
    a.localeCompare(b),
  );

  return sortedSitemaps.map(
    ([sitemap, siteIndexes]) =>
      new Artifact({
        filePath: `sitemap-${sitemap}.xml`,
        content: renderSitemapXml(siteIndexes, siteUrl),
      }),
  );
}

function renderSitemapIndexXml(paths: string[], siteUrl: string): string {
  const lines: string[] = [
    XML_VERSION_DECLARATION,
    `<sitemapindex xmlns="${SITEMAP_XML_NAMESPACE}">`,
  ];

  for (const path of paths) {
    const loc = escapeXml(`${siteUrl}${path}`);

    lines.push("  <sitemap>", `    <loc>${loc}</loc>`, "  </sitemap>");
  }

  lines.push("</sitemapindex>");

  return lines.join("\n");
}

export function makeSitemapIndexArtifact(
  sitemaps: Artifact[],
  siteUrl: string,
): Artifact {
  const paths = sitemaps
    .map((artifact) => artifact.filePath)
    .toSorted((a, b) => a.localeCompare(b));

  return new Artifact({
    filePath: "sitemap.xml",
    content: renderSitemapIndexXml(paths, siteUrl),
  });
}
