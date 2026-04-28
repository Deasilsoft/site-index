import type { Options as CoreOptions } from "@site-index/core";
import { makeViteSiteIndexPipelineService } from "@site-index/vite-runtime";
import * as Vite from "vite";
import pkg from "../../../package.json" with { type: "json" };
import { makeArtifactsMiddleware } from "./artifacts.middleware.js";

type Options = Pick<CoreOptions, "siteUrl" | "extensions">;

export function siteIndexServePlugin(options: Options): Vite.Plugin {
  const service = makeViteSiteIndexPipelineService(options, pkg.name);

  return {
    name: `${pkg.name}:serve`,
    apply: "serve",
    configResolved(resolvedConfig) {
      service.setViteConfig(resolvedConfig);
    },
    configureServer(server) {
      service.configureServer(server);
      server.middlewares.use(
        makeArtifactsMiddleware(service.getServeArtifacts()),
      );
    },
  };
}
