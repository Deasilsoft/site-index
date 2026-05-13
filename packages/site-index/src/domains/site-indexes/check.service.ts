import { createRuntimeService } from "@site-index/vite-runtime";
import { logger } from "../../shared/logging/logger.js";
import type { CheckConfig } from "./types.js";
import { makeResolvedViteConfig } from "./vite.config.js";

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

    if (result.warnings.length > 0) {
      logger.warn(result.warnings);

      throw new Error(`Check failed with ${result.warnings.length} warning(s)`);
    }
  } finally {
    await runtime.close();
  }
}
