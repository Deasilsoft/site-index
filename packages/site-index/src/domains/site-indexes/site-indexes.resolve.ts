import type { Result, Warning, WithSource } from "../../shared/types.js";
import type { ResolvedModule } from "./modules.schema.js";
import type { ResolvedSiteIndex } from "./site-indexes.schema.js";

export function resolveSiteIndexes(
  modules: ResolvedModule[],
): Result<WithSource<ResolvedSiteIndex>[]> {
  const data = new Map<string, WithSource<ResolvedSiteIndex>>();
  const warnings: Warning[] = [];

  for (const module of modules) {
    for (const siteIndex of module.siteIndexes) {
      const duplicate = data.get(siteIndex.url);

      if (duplicate) {
        warnings.push({
          message: `Duplicate URL "${duplicate.url}" found in "${duplicate.filePath}"`,
          filePath: module.filePath,
        });

        continue;
      }

      data.set(siteIndex.url, {
        ...siteIndex,
        filePath: module.filePath,
      });
    }
  }

  return {
    data: [...data.values()].sort(
      (a, b) =>
        a.sitemap.localeCompare(b.sitemap) || a.url.localeCompare(b.url),
    ),
    warnings,
  };
}
