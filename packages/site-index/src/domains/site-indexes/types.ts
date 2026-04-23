export type SiteIndex = {
  url: `/${string}`;
  lastModified?: string | undefined;
  sitemap?: string | undefined;
  index?: boolean | undefined;
};

export type ResolvedSiteIndex = {
  url: `/${string}`;
  lastModified?: string | undefined;
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
