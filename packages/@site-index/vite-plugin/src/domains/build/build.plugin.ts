import type { Options as CoreOptions } from "@site-index/core";
import { createRuntimeService } from "@site-index/vite-runtime";
import * as Vite from "vite";
import pkg from "../../../package.json" with { type: "json" };

type Options = Pick<CoreOptions, "siteUrl" | "extensions">;

export function siteIndexBuildPlugin(options: Options): Vite.Plugin {
  const runtime = createRuntimeService().withOptions(options).build();

  return {
    name: `${pkg.name}:build`,
    apply: "build",
    configResolved(resolvedConfig) {
      runtime.setViteConfig(resolvedConfig);
    },
    async buildStart() {
      const result = await runtime.buildArtifacts();

      for (const warning of result.warnings) {
        this.warn(warning.message);
      }
    },
    generateBundle() {
      for (const artifact of runtime.getArtifacts()) {
        this.emitFile({
          type: "asset",
          fileName: artifact.filePath,
          source: artifact.content,
        });
      }
    },
    async closeBundle() {
      await runtime.close();
    },
  };
}
