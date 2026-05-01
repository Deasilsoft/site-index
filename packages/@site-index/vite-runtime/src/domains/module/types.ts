import type * as SiteIndex from "@site-index/core";
import type * as Vite from "vite";

export type LoadedViteModule = SiteIndex.LoadedModule & {
  node: Vite.EnvironmentModuleNode;
};
