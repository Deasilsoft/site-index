import type { Module, ModuleExports } from "../site-indexes/types.js";

export type ModuleLoader = (module: Module) => Promise<ModuleExports>;

export type Options = {
  siteUrl: string;
  rootPath: string;
  extensions?: string[] | undefined;
  loadModule: ModuleLoader;
};
