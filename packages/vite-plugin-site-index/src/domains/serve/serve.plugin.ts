import * as Vite from "vite";
import pkg from "../../../package.json" with { type: "json" };
import type { Options } from "../options/types.js";
import { serveArtifacts } from "./serve.artifacts.js";

export function siteIndexServePlugin(options: Options): Vite.Plugin {
  let viteConfig: Vite.ResolvedConfig | undefined;

  return {
    name: `${pkg.name}:serve`,
    apply: "serve",

    configResolved(resolvedConfig) {
      viteConfig = resolvedConfig;
    },

    configureServer(server) {
      if (viteConfig === undefined) {
        throw new Error(`[${pkg.name}] Vite config could not be resolved`);
      }

      serveArtifacts(server, options, viteConfig);
    },
  };
}
