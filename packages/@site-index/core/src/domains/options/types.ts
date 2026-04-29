import type { Module, SiteIndexModule } from "../site-indexes/types.js";

export type LoadSiteIndexModule = (module: Module) => Promise<SiteIndexModule>;

export type Options = {
  siteUrl: string;
  rootPath: string;
  extensions?: string[] | undefined;
  loadModule: LoadSiteIndexModule;
};
