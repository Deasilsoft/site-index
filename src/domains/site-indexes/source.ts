import type {
  SiteIndexesSource,
  SiteIndexesSourceResult,
} from "@/domains/pipeline";
import type { ModuleLoaderContext } from "./context.js";
import { loadSiteIndexRegistry } from "./loader.js";
import type { SiteIndexModule, SiteIndexes } from "./types.js";

function extractSiteIndexes(siteIndexModule: SiteIndexModule): SiteIndexes {
  if (
    !siteIndexModule ||
    typeof siteIndexModule !== "object" ||
    !siteIndexModule.siteIndexes
  ) {
    throw new Error("Module must export siteIndexes");
  }

  return siteIndexModule.siteIndexes;
}

export function createSiteIndexesSource(
  context?: ModuleLoaderContext,
): SiteIndexesSource {
  return {
    async loadSiteIndexes(): Promise<SiteIndexesSourceResult> {
      const loadResult = await loadSiteIndexRegistry(context);
      const siteIndexes: SiteIndexes = [];

      for (const [, siteIndexModule] of Object.entries(loadResult.registry)) {
        siteIndexes.push(...extractSiteIndexes(siteIndexModule));
      }

      return { siteIndexes, warnings: loadResult.warnings };
    },
  };
}
