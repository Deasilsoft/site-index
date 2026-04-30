import type * as SiteIndex from "@site-index/core";
import type * as Vite from "vite";

export type Options = Pick<SiteIndex.Options, "siteUrl" | "extensions">;

export type RuntimeViteConfig = {
  root: Vite.ResolvedConfig["root"];
  mode: Vite.ResolvedConfig["mode"];
  configFile?: Vite.ResolvedConfig["configFile"];
};
