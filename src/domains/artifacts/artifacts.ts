import { renderRobotsTxt } from "./robots.js";
import { renderSitemapIndexXml, renderSitemapXml } from "./sitemaps.js";
import type { Artifact, ResolvedSiteIndex } from "./types.js";

function mapSiteIndexesBySitemap(
  siteIndexes: ResolvedSiteIndex[],
): Map<string, ResolvedSiteIndex[]> {
  const sitemapGroups = new Map<string, ResolvedSiteIndex[]>();

  for (const siteIndex of siteIndexes) {
    if (!siteIndex.index) continue;

    const group = sitemapGroups.get(siteIndex.sitemap);

    if (group) {
      group.push(siteIndex);
    } else {
      sitemapGroups.set(siteIndex.sitemap, [siteIndex]);
    }
  }

  return sitemapGroups;
}

function buildSitemapArtifacts(
  siteIndexesBySitemap: Map<string, ResolvedSiteIndex[]>,
  siteUrl: string,
): Artifact[] {
  const sortedSitemaps = [...siteIndexesBySitemap.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  );

  const sitemapArtifacts: Artifact[] = [];

  for (const [name, siteIndexes] of sortedSitemaps) {
    const artifact = {
      path: `/sitemap-${name}.xml`,
      content: renderSitemapXml(siteIndexes, siteUrl),
    };

    sitemapArtifacts.push(artifact);
  }

  return sitemapArtifacts;
}

function buildSitemapIndexArtifact(
  sitemapPaths: string[],
  siteUrl: string,
): Artifact {
  return {
    path: "/sitemap.xml",
    content: renderSitemapIndexXml(sitemapPaths, siteUrl),
  };
}

function buildRobotsArtifact(
  siteIndexes: ResolvedSiteIndex[],
  siteUrl: string,
): Artifact {
  const disallowed = siteIndexes
    .filter((siteIndex) => !siteIndex.index)
    .map((siteIndex) => siteIndex.url)
    .sort((a, b) => a.localeCompare(b));

  return {
    path: "/robots.txt",
    content: renderRobotsTxt(siteUrl, disallowed),
  };
}

export function buildArtifacts(
  siteIndexes: ResolvedSiteIndex[],
  siteUrl: string,
): Artifact[] {
  const siteIndexesBySitemap = mapSiteIndexesBySitemap(siteIndexes);
  const sitemapArtifacts = buildSitemapArtifacts(siteIndexesBySitemap, siteUrl);
  const sitemapPaths = sitemapArtifacts.map((artifact) => artifact.path);

  return [
    ...sitemapArtifacts,
    buildSitemapIndexArtifact(sitemapPaths, siteUrl),
    buildRobotsArtifact(siteIndexes, siteUrl),
  ];
}
