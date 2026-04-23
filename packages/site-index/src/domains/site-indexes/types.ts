export type SiteIndex = {
  url: `/${string}`;
  lastModified?: string | undefined;
  sitemap?: string | undefined;
  index?: boolean | undefined;
};

export type Module = {
  filePath: string;
  importId: string;
};

export type ModuleExports = {
  siteIndexes: SiteIndex[];
};

export type LoadedModule = Module & ModuleExports;
