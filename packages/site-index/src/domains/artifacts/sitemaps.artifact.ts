import type { ResolvedSiteIndex } from "../site-indexes/types.js";
import type { Artifact } from "./types.js";

const XML_VERSION_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';
const SITEMAP_XML_NAMESPACE = "https://www.sitemaps.org/schemas/sitemap/0.9";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderSitemapXml(
  siteIndexes: ResolvedSiteIndex[],
  siteUrl: string,
): string {
  const lines: string[] = [];

  lines.push(XML_VERSION_DECLARATION);
  lines.push(`<urlset xmlns="${SITEMAP_XML_NAMESPACE}">`);

  for (const siteIndex of siteIndexes) {
    const loc = escapeXml(`${siteUrl}${siteIndex.url}`);

    lines.push("  <url>");
    lines.push(`    <loc>${loc}</loc>`);

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
  const sortedSitemaps = [...sitemaps.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return sortedSitemaps.map(([sitemap, siteIndexes]) => ({
    filePath: `/sitemap-${sitemap}.xml`,
    content: renderSitemapXml(siteIndexes, siteUrl),
  }));
}

function renderSitemapIndexXml(paths: string[], siteUrl: string): string {
  const lines: string[] = [];

  lines.push(XML_VERSION_DECLARATION);
  lines.push(`<sitemapindex xmlns="${SITEMAP_XML_NAMESPACE}">`);

  for (const path of paths) {
    const loc = escapeXml(`${siteUrl}${path}`);

    lines.push("  <sitemap>");
    lines.push(`    <loc>${loc}</loc>`);
    lines.push("  </sitemap>");
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
    .sort((a, b) => a.localeCompare(b));

  return {
    filePath: "/sitemap.xml",
    content: renderSitemapIndexXml(paths, siteUrl),
  };
}
