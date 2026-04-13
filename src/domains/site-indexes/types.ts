import type { WithWarnings } from "@/shared/types.js";

export type SiteIndex = {
  url: `/${string}`;
  lastModified?: string;
  sitemap?: string;
  index?: boolean;
};

export type SiteIndexes = SiteIndex[];

export type SiteIndexModule = {
  siteIndexes: SiteIndexes;
};

export type Registry = Record<string, SiteIndexModule>;

export type RegistryLoadResult = WithWarnings<{
  registry: Registry;
}>;
