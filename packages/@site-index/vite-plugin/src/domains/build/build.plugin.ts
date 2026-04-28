import type { Options as CoreOptions } from "@site-index/core";
import { makeViteSiteIndexPipelineService } from "@site-index/vite-runtime";
import * as Vite from "vite";
import pkg from "../../../package.json" with { type: "json" };

type EmittedAsset = { type: "asset"; fileName: string; source: string };
type Options = Pick<CoreOptions, "siteUrl" | "extensions">;

export function siteIndexBuildPlugin(options: Options): Vite.Plugin {
  const service = makeViteSiteIndexPipelineService(options, pkg.name);

  return {
    name: `${pkg.name}:build`,
    apply: "build",
    configResolved(resolvedConfig) {
      service.setViteConfig(resolvedConfig);
    },
    async buildStart() {
      const unsubscribeWarning = service.onWarning((warning: string) => {
        this.warn(warning);
      });

      try {
        await service.prepareArtifacts();
      } finally {
        unsubscribeWarning();
      }
    },
    generateBundle() {
      const unsubscribeAsset = service.onArtifact((artifact: EmittedAsset) => {
        this.emitFile(artifact);
      });

      try {
        service.publishArtifacts();
      } finally {
        unsubscribeAsset();
      }
    },
  };
}
