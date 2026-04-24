import * as SiteIndex from "site-index";
import * as Vite from "vite";
import pkg from "../../../package.json" with { type: "json" };
import {
  loadRuntimeModuleDefault,
  makeRuntimeServer,
} from "../../shared/vite-runtime.js";
import type { Options } from "../options/types.js";

export function siteIndexBuildPlugin(options: Options): Vite.Plugin {
  let viteConfig: Vite.ResolvedConfig | undefined;
  let artifacts: SiteIndex.Artifact[] = [];

  return {
    name: `${pkg.name}:build`,
    apply: "build",

    configResolved(resolvedConfig) {
      viteConfig = resolvedConfig;
    },

    async buildStart() {
      if (viteConfig === undefined) {
        throw new Error(`[${pkg.name}] Vite config could not be resolved`);
      }

      const server = await makeRuntimeServer(viteConfig);

      try {
        const result = await SiteIndex.main({
          siteUrl: options.siteUrl,
          rootPath: viteConfig.root,
          extensions: options.extensions,
          loadModule: (module) =>
            loadRuntimeModuleDefault(server, module.importId),
        });

        for (const warning of result.warnings) {
          this.warn(warning.message);
        }

        artifacts = result.data;
      } finally {
        await server.close();
      }
    },

    generateBundle() {
      for (const artifact of artifacts) {
        this.emitFile({
          type: "asset",
          fileName: artifact.filePath,
          source: artifact.content,
        });
      }
    },
  };
}
