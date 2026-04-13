import type { Options } from "@/domains/config";
import { resolveConfig } from "@/domains/config";
import { pipeline } from "@/domains/pipeline";
import {
  createSiteIndexesSource,
  type ModuleLoaderContext,
} from "@/domains/site-indexes";
import { configureSiteIndexServer } from "@/domains/vite-server";
import type { ArtifactsRef } from "@/domains/vite-server/types.js";
import type { Plugin, ResolvedConfig, ViteDevServer } from "vite";

export function siteIndexPlugin(options: Options): Plugin {
  const config = resolveConfig(options);
  const artifactsRef: ArtifactsRef = { current: [] };

  let command: ResolvedConfig["command"] = "build";

  function createModuleLoaderContext(
    server?: ViteDevServer,
  ): ModuleLoaderContext | undefined {
    if (!server) {
      return undefined;
    }

    return {
      root: server.config.root,
      ssrLoadModule: (id: string) => server.ssrLoadModule(id),
    };
  }

  async function refreshArtifacts(
    warn: (warning: string) => void,
    server?: ViteDevServer,
  ): Promise<void> {
    const source = createSiteIndexesSource(createModuleLoaderContext(server));
    const output = await pipeline(config, source);

    artifactsRef.current = output.artifacts;

    for (const warning of output.warnings) {
      warn(warning);
    }
  }

  async function refreshFromDevServer(server: ViteDevServer): Promise<void> {
    await refreshArtifacts(
      (warning) =>
        server.config.logger.warn(`[vite-plugin-site-index] ${warning}`),
      server,
    );
  }

  return {
    name: "vite-plugin-site-index",
    configResolved(resolvedConfig) {
      command = resolvedConfig.command;
    },
    async buildStart() {
      if (command === "serve") {
        return;
      }

      await refreshArtifacts((warning) => this.warn(warning));
    },
    configureServer(server) {
      configureSiteIndexServer(server, artifactsRef, refreshFromDevServer);
    },
    generateBundle() {
      for (const artifact of artifactsRef.current) {
        this.emitFile({
          type: "asset",
          fileName: artifact.path.replace(/^\//, ""),
          source: artifact.content,
        });
      }
    },
  };
}
