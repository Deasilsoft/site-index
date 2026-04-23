import type { LoadedModule, Module } from "../site-indexes/types.js";

export type LoadModule = (
  module: Module,
) => Promise<LoadedModule["defaultExport"]>;

export type Options = {
  siteUrl: string;
  rootPath: string;
  extensions?: string[] | undefined;
  loadModule: LoadModule;
};
