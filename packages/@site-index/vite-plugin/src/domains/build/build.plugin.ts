import type { Options as CoreOptions } from "@site-index/core";
import { Logger } from "@site-index/observability";
import type { RuntimeService } from "@site-index/vite-runtime";
import { createRuntimeService } from "@site-index/vite-runtime";
import * as Vite from "vite";
import pkg from "../../../package.json" with { type: "json" };

type Options = Pick<CoreOptions, "siteUrl" | "extensions">;

export function siteIndexBuildPlugin(options: Options): Vite.Plugin {
  const logger = new Logger();
  let runtime: RuntimeService | undefined;
  let isRuntimeClosed = false;

  function getRuntime(): RuntimeService {
    if (runtime === undefined) {
      throw new Error("Vite config could not be resolved");
    }

    return runtime;
  }

  async function closeRuntime(): Promise<void> {
    if (isRuntimeClosed) {
      return;
    }

    isRuntimeClosed = true;

    await runtime?.close();
  }

  return {
    name: `${pkg.name}:build`,
    apply: "build",
    configResolved(config) {
      runtime = createRuntimeService()
        .withOptions(options)
        .withViteConfig(config)
        .build();

      logger.configure({ writer: config.logger });
    },
    async buildStart() {
      try {
        const result = await getRuntime().buildArtifacts();

        logger.warn(result.warnings);
      } catch (error) {
        await closeRuntime();

        throw error;
      }
    },
    generateBundle() {
      for (const artifact of getRuntime().getArtifacts()) {
        this.emitFile({
          type: "asset",
          fileName: artifact.filePath,
          source: artifact.content,
        });
      }
    },
    async closeBundle() {
      await closeRuntime();
    },
  };
}
