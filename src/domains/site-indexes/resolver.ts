import { normalizePath } from "vite";
import type { SiteIndexModule } from "./types.js";

function normalizeSiteIndexModule(loaded: unknown): SiteIndexModule {
  if (!loaded || typeof loaded !== "object") {
    throw new Error("Module must export siteIndexes");
  }

  const raw = loaded as Partial<SiteIndexModule> & { default?: unknown };

  if (raw.siteIndexes) {
    return raw as SiteIndexModule;
  }

  if (raw.default && typeof raw.default === "object") {
    const defaultExport = raw.default as Partial<SiteIndexModule>;

    if (defaultExport.siteIndexes) {
      return defaultExport as SiteIndexModule;
    }
  }

  return raw as SiteIndexModule;
}

export async function loadSiteIndexModule(
  file: string,
  loadWithVite: (id: string) => Promise<unknown>,
): Promise<SiteIndexModule> {
  const loaded = await loadWithVite(normalizePath(file));

  return normalizeSiteIndexModule(loaded);
}
