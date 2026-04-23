import type { ResolvedSiteIndex } from "../site-indexes/site-indexes.schema.js";
import type { Artifact } from "./types.js";

function renderRobotsTxt(siteUrl: string, disallowedPaths: string[]): string {
  const lines: string[] = [];

  lines.push("User-agent: *");

  for (const path of disallowedPaths) {
    lines.push(`Disallow: ${path}`);
  }

  lines.push(`Sitemap: ${siteUrl}/sitemap.xml`);

  return lines.join("\n");
}

export function makeRobotsArtifact(
  siteIndexes: ResolvedSiteIndex[],
  siteUrl: string,
): Artifact {
  const disallowed = siteIndexes
    .filter((siteIndex) => !siteIndex.index)
    .map((siteIndex) => siteIndex.url)
    .sort((a, b) => a.localeCompare(b));

  return {
    filePath: "/robots.txt",
    content: renderRobotsTxt(siteUrl, disallowed),
    contentType: "text/plain; charset=utf-8",
  };
}
