import * as SiteIndex from "site-index";
import * as Vite from "vite";
import { collectRelevantFiles } from "../../shared/vite-dependency-graph.js";
import { makeTrackingModuleLoader } from "../../shared/vite-runtime.js";
import type { Options } from "../options/types.js";

export type ServeRefresh = {
  requestRefresh(): Promise<void>;
};

export function makeServeRefresh(
  server: Vite.ViteDevServer,
  options: Options,
  viteConfig: Vite.ResolvedConfig,
  onSuccessfulRefresh: (result: {
    artifacts: SiteIndex.Artifact[];
    nextRelevantFiles: Set<string>;
  }) => void,
): ServeRefresh {
  let inFlight: Promise<void> | null = null;
  let rerunRequested = false;

  async function refresh(): Promise<void> {
    try {
      const { loadModule, loadedImportIds } = makeTrackingModuleLoader(server);

      const result = await SiteIndex.main({
        siteUrl: options.siteUrl,
        rootPath: viteConfig.root,
        extensions: options.extensions,
        loadModule,
      });

      const nextRelevantFiles = await collectRelevantFiles(
        server,
        loadedImportIds,
      );

      for (const warning of result.warnings) {
        server.config.logger.warn(warning.message);
      }

      onSuccessfulRefresh({
        artifacts: result.data,
        nextRelevantFiles,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      server.config.logger.error(
        `Failed to generate site-index artifacts: ${message}`,
      );
    }
  }

  async function run(): Promise<void> {
    do {
      rerunRequested = false;

      await refresh();
    } while (rerunRequested);
  }

  function requestRefresh(): Promise<void> {
    if (inFlight !== null) {
      rerunRequested = true;

      return inFlight;
    }

    inFlight = run().finally(() => {
      inFlight = null;
    });

    return inFlight;
  }

  return {
    requestRefresh,
  };
}
