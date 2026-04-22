import type { Result, Warning } from "../../shared/types.js";
import type {
  ResolvedModule,
  ResolvedSiteIndex,
  SiteIndex,
  SourcedResolvedSiteIndex,
} from "./types.js";

const DEFAULT_SITEMAP = "pages";
const DEFAULT_INDEX = true;

function compareResolvedSiteIndexes(
  left: ResolvedSiteIndex,
  right: ResolvedSiteIndex,
): number {
  return (
    left.sitemap.localeCompare(right.sitemap) ||
    left.url.localeCompare(right.url)
  );
}

function resolveSiteIndex(siteIndex: SiteIndex): ResolvedSiteIndex {
  const resolvedSiteIndex: ResolvedSiteIndex = {
    url: siteIndex.url,
    sitemap: siteIndex.sitemap ?? DEFAULT_SITEMAP,
    index: siteIndex.index ?? DEFAULT_INDEX,
  };

  if (siteIndex.lastModified !== undefined) {
    resolvedSiteIndex.lastModified = siteIndex.lastModified;
  }

  return resolvedSiteIndex;
}

function resolveModuleSiteIndexes(
  resolvedModule: ResolvedModule,
): SourcedResolvedSiteIndex[] {
  return resolvedModule.siteIndexes.map((siteIndex) => ({
    filePath: resolvedModule.module.filePath,
    siteIndex: resolveSiteIndex(siteIndex),
  }));
}

function deduplicateSiteIndexes(
  sourcedSiteIndexes: SourcedResolvedSiteIndex[],
): Result<ResolvedSiteIndex[]> {
  const warnings: Warning[] = [];
  const firstSiteIndexByUrl = new Map<string, SourcedResolvedSiteIndex>();

  for (const sourcedSiteIndex of sourcedSiteIndexes) {
    const url = sourcedSiteIndex.siteIndex.url;
    const existingSiteIndex = firstSiteIndexByUrl.get(url);

    if (existingSiteIndex) {
      warnings.push({
        message: `Duplicate url ignored: ${url} (already defined in ${existingSiteIndex.filePath})`,
        filePath: sourcedSiteIndex.filePath,
      });
      continue;
    }

    firstSiteIndexByUrl.set(url, sourcedSiteIndex);
  }

  return {
    data: [...firstSiteIndexByUrl.values()]
      .map(({ siteIndex }) => siteIndex)
      .sort(compareResolvedSiteIndexes),
    warnings,
  };
}

export function validateSiteIndexes(
  resolvedModules: ResolvedModule[],
): Result<ResolvedSiteIndex[]> {
  return deduplicateSiteIndexes(
    resolvedModules.flatMap(resolveModuleSiteIndexes),
  );
}
