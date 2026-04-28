import type { Options as CoreOptions } from "@site-index/core";
import * as Vite from "vite";
import { siteIndexBuildPlugin } from "./domains/build/build.plugin.js";
import { siteIndexServePlugin } from "./domains/serve/serve.plugin.js";

type Options = Pick<CoreOptions, "siteUrl" | "extensions">;

export function siteIndexPlugin(options: Options): Vite.Plugin[] {
  return [siteIndexServePlugin(options), siteIndexBuildPlugin(options)];
}
