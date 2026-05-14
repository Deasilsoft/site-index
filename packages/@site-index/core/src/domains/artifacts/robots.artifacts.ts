import type { ResolvedSiteIndex } from "../site-indexes/schemas/site-indexes.schema.js";
import { Artifact } from "./artifact.js";

function renderRobotsTxt(siteUrl: string, disallowedPaths: string[]): string {
  const lines: string[] = ["User-agent: *"];

  for (const path of disallowedPaths) {
    lines.push(`Disallow: ${path}`);
  }

  lines.push(`Sitemap: ${siteUrl}/sitemap.xml`);

  return `${lines.join("\n")}\n`;
}

export function makeRobotsArtifact(
  siteIndexes: ResolvedSiteIndex[],
  siteUrl: string,
): Artifact {
  const disallowed = siteIndexes
    .filter((siteIndex) => !siteIndex.index)
    .map((siteIndex) => siteIndex.url)
    .toSorted((a, b) => a.localeCompare(b));

  return new Artifact({
    filePath: "robots.txt",
    content: renderRobotsTxt(siteUrl, disallowed),
  });
}
