import type { Result } from "../../shared/types.js";
import type { LoadedModule, Module } from "../site-indexes/types.js";

export type ModuleLoader = (
  modules: Module[],
) => Promise<Result<LoadedModule[]>>;

export type Options = {
  siteUrl: string;
  rootPath: string;
  extensions?: string[];
  loadModules: ModuleLoader;
};
