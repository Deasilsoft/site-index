import type { ResolvedSiteIndex } from "../site-indexes/schemas/site-indexes.schema.js";
import { makeRobotsArtifact } from "./robots.artifacts.js";
import {
  makeSitemapArtifacts,
  makeSitemapIndexArtifact,
} from "./sitemaps.artifacts.js";
import type { Artifact } from "./types.js";

function makeSitemapGroups(
  siteIndexes: ResolvedSiteIndex[],
): Map<string, ResolvedSiteIndex[]> {
  const sitemapGroups = new Map<string, ResolvedSiteIndex[]>();

  for (const siteIndex of siteIndexes) {
    if (!siteIndex.index) continue;

    const sitemapGroup = sitemapGroups.get(siteIndex.sitemap);

    if (sitemapGroup) {
      sitemapGroup.push(siteIndex);
    } else {
      sitemapGroups.set(siteIndex.sitemap, [siteIndex]);
    }
  }

  return sitemapGroups;
}

export function makeArtifacts(
  siteUrl: string,
  siteIndexes: ResolvedSiteIndex[],
): Artifact[] {
  const sitemapGroups = makeSitemapGroups(siteIndexes);
  const sitemapArtifacts = makeSitemapArtifacts(sitemapGroups, siteUrl);

  return [
    ...sitemapArtifacts,
    makeSitemapIndexArtifact(sitemapArtifacts, siteUrl),
    makeRobotsArtifact(siteIndexes, siteUrl),
  ];
}
