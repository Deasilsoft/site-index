import type * as SiteIndex from "@site-index/core";
import type { Options as CoreOptions } from "@site-index/core";
import { createRuntimeService } from "@site-index/vite-runtime";
import * as Vite from "vite";
import pkg from "../../../package.json" with { type: "json" };
import { makeArtifactsMiddleware } from "./artifacts.middleware.js";

type Options = Pick<CoreOptions, "siteUrl" | "extensions">;

export function siteIndexServePlugin(options: Options): Vite.Plugin {
  const runtime = createRuntimeService().withOptions(options).build();
  const artifacts = new Map<string, SiteIndex.Artifact>();

  function syncArtifacts(): void {
    artifacts.clear();

    for (const artifact of runtime.getArtifacts()) {
      artifacts.set(
        artifact.filePath.startsWith("/")
          ? artifact.filePath
          : `/${artifact.filePath}`,
        artifact,
      );
    }
  }

  return {
    name: `${pkg.name}:serve`,
    apply: "serve",
    configResolved(resolvedConfig) {
      runtime.setViteConfig(resolvedConfig);
    },
    configureServer(server) {
      runtime.attachViteServer(server);
      server.middlewares.use(makeArtifactsMiddleware(artifacts));

      void runtime
        .buildArtifacts()
        .then((result) => {
          syncArtifacts();

          for (const warning of result.warnings) {
            server.config.logger.warn(warning.message);
          }
        })
        .catch((error) => {
          server.config.logger.error(
            error instanceof Error ? error.message : String(error),
          );
        });
    },
    async handleHotUpdate(ctx) {
      if (!runtime.getWatchedFiles().has(ctx.file)) {
        return;
      }

      try {
        const result = await runtime.buildArtifacts();
        syncArtifacts();

        for (const warning of result.warnings) {
          ctx.server.config.logger.warn(warning.message);
        }
      } catch (error) {
        ctx.server.config.logger.error(
          error instanceof Error ? error.message : String(error),
        );
      }
    },
    async closeBundle() {
      await runtime.close();
    },
  };
}
