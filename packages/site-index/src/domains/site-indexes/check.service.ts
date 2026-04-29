import { createRuntimeService } from "@site-index/vite-runtime";
import type * as Vite from "vite";
import { logger } from "../../shared/services/logger.service.js";
import type { CheckConfig } from "./types.js";

function makeResolvedViteConfig(config: CheckConfig): Vite.ResolvedConfig {
  return {
    root: config.rootPath,
    mode: "production",
    configFile: config.configFile ?? false,
  } as Vite.ResolvedConfig;
}

export async function runCheck(config: CheckConfig): Promise<void> {
  const runtime = createRuntimeService()
    .withOptions({
      siteUrl: config.siteUrl,
      extensions: undefined,
    })
    .withViteConfig(makeResolvedViteConfig(config))
    .build();

  try {
    const result = await runtime.buildArtifacts();

    for (const warning of result.warnings) {
      logger.warn(warning);
    }

    if (result.warnings.length > 0) {
      throw new Error(`Check failed with ${result.warnings.length} warning(s)`);
    }
  } finally {
    await runtime.close();
  }
}
