import type { ResolvedSiteIndex } from "../site-indexes/types.js";
import { makeRobotsArtifact } from "./robots.artifact.js";
import {
  makeSitemapArtifacts,
  makeSitemapIndexArtifact,
} from "./sitemaps.artifact.js";
import type { Artifact } from "./types.js";

function makeSitemapGroups(
  siteIndexes: ResolvedSiteIndex[],
): Map<string, ResolvedSiteIndex[]> {
  const groups = new Map<string, ResolvedSiteIndex[]>();

  for (const siteIndex of siteIndexes) {
    if (!siteIndex.index) continue;

    const group = groups.get(siteIndex.sitemap);

    if (group) {
      group.push(siteIndex);
    } else {
      groups.set(siteIndex.sitemap, [siteIndex]);
    }
  }

  return groups;
}

export function makeArtifacts(
  siteUrl: string,
  siteIndexes: ResolvedSiteIndex[],
): Artifact[] {
  const sitemaps = makeSitemapGroups(siteIndexes);
  const sitemapArtifacts = makeSitemapArtifacts(sitemaps, siteUrl);

  return [
    ...sitemapArtifacts,
    makeSitemapIndexArtifact(sitemapArtifacts, siteUrl),
    makeRobotsArtifact(siteIndexes, siteUrl),
  ];
}
