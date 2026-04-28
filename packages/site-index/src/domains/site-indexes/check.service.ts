import type { Warning } from "@site-index/core";
import { makeViteSiteIndexService } from "@site-index/vite-runtime";
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
  const runtime = makeViteSiteIndexService({
    viteConfig: makeResolvedViteConfig(config),
  });
  const warnings: Warning[] = [];
  const unsubscribeWarning = runtime.onWarning((warning) => {
    warnings.push(warning);
  });

  try {
    await runtime.runSiteIndex({
      siteUrl: config.siteUrl,
      rootPath: config.rootPath,
      extensions: undefined,
    });

    for (const warning of warnings) {
      logger.warn(warning);
    }

    if (warnings.length > 0) {
      throw new Error(`Check failed with ${warnings.length} warning(s)`);
    }
  } finally {
    unsubscribeWarning();
    await runtime.close();
  }
}
