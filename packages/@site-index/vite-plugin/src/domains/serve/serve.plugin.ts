import type * as SiteIndex from "@site-index/core";
import type { Options as CoreOptions } from "@site-index/core";
import { Logger } from "@site-index/observability";
import type { RuntimeService } from "@site-index/vite-runtime";
import { createRuntimeService } from "@site-index/vite-runtime";
import * as Vite from "vite";
import pkg from "../../../package.json" with { type: "json" };
import { makeArtifactsMiddleware } from "./artifacts.middleware.js";

type Options = Pick<CoreOptions, "siteUrl" | "extensions">;

export function siteIndexServePlugin(options: Options): Vite.Plugin {
  const logger = new Logger();
  let runtime: RuntimeService | undefined;
  const artifacts = new Map<string, SiteIndex.Artifact>();

  async function buildArtifacts(): Promise<void> {
    if (!runtime) {
      return;
    }

    try {
      const result = await runtime.buildArtifacts();

      artifacts.clear();

      for (const artifact of result.data) {
        artifacts.set(`/${artifact.filePath}`, artifact);
      }

      logger.warn(result.warnings);
    } catch (error) {
      logger.error(error);
    }
  }

  return {
    name: `${pkg.name}:serve`,
    apply: "serve",
    async configureServer(server) {
      runtime = createRuntimeService()
        .withOptions(options)
        .withViteServer(server)
        .build();

      logger.configure({ writer: server.config.logger });
      server.middlewares.use(makeArtifactsMiddleware(artifacts));

      await buildArtifacts();
    },
    async handleHotUpdate(context) {
      if (runtime === undefined) {
        return;
      }

      if (!runtime.getWatchedFiles().has(context.file)) {
        return;
      }

      await buildArtifacts();
    },
    async closeBundle() {
      await runtime?.close();

      runtime = undefined;
    },
  };
}
