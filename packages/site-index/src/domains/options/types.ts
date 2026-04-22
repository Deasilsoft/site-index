import type { LoadedModule, Module } from "../site-indexes/types.js";

export type LoadModule = (module: Module) => Promise<LoadedModule["exports"]>;

export type Options = {
  siteUrl: string;
  rootPath: string;
  extensions?: string[];
  loadModule: LoadModule;
};
