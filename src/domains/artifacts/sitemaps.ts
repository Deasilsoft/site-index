import { normalizeUrl } from "@/shared/utils.js";
import type { ResolvedSiteIndex } from "./types.js";

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

export function renderSitemapXml(
  siteIndexes: ResolvedSiteIndex[],
  siteUrl: string,
): string {
  const normalizedSiteUrl = normalizeUrl(siteUrl);
  const lines: string[] = [];

  lines.push(XML_VERSION_DECLARATION);
  lines.push(`<urlset xmlns="${SITEMAP_XML_NAMESPACE}">`);

  for (const siteIndex of siteIndexes) {
    const loc = escapeXml(`${normalizedSiteUrl}${siteIndex.url}`);

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

export function renderSitemapIndexXml(
  sitemapPaths: string[],
  siteUrl: string,
): string {
  const normalizedSiteUrl = normalizeUrl(siteUrl);
  const lines: string[] = [];

  lines.push(XML_VERSION_DECLARATION);
  lines.push(`<sitemapindex xmlns="${SITEMAP_XML_NAMESPACE}">`);

  for (const path of sitemapPaths) {
    const loc = escapeXml(`${normalizedSiteUrl}${path}`);

    lines.push("  <sitemap>");
    lines.push(`    <loc>${loc}</loc>`);
    lines.push("  </sitemap>");
  }

  lines.push("</sitemapindex>");

  return lines.join("\n");
}
