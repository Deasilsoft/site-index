import * as Vite from "vite";
import { siteIndexBuildPlugin } from "./domains/build/build.plugin.js";
import type { Options } from "./domains/options/types.js";
import { siteIndexServePlugin } from "./domains/serve/serve.plugin.js";

export function siteIndexPlugin(options: Options): Vite.Plugin[] {
  return [siteIndexServePlugin(options), siteIndexBuildPlugin(options)];
}
