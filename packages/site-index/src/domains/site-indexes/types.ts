export type SiteIndex = {
  url: `/${string}`;
  lastModified?: string;
  sitemap?: string;
  index?: boolean;
};

export type ResolvedSiteIndex = {
  url: `/${string}`;
  lastModified?: string;
  sitemap: string;
  index: boolean;
};

export type SourcedResolvedSiteIndex = {
  filePath: string;
  siteIndex: ResolvedSiteIndex;
};

export type Module = {
  filePath: string;
  importId: string;
};

export type LoadedModule = {
  module: Module;
  defaultExport: {
    siteIndexes: SiteIndex[];
  };
};

export type ResolvedModule = {
  module: Module;
  siteIndexes: SiteIndex[];
};
