import { logger } from "../../shared/services/logger.service.js";
import { fileExists } from "./adapters/fs.js";
import { scaffoldSiteIndexModule } from "./adapters/site-index.js";
import type { MakeConfig } from "./types.js";

export async function runMake(config: MakeConfig): Promise<void> {
  if ((await fileExists(config.outputFilePath)) && !config.force) {
    throw new Error(
      `Refusing to overwrite existing file: ${config.outputFilePath} (use --force)`,
    );
  }

  const result = await scaffoldSiteIndexModule({
    filePath: config.outputFilePath,
    format: config.format,
    lastModified: new Date().toISOString(),
  });

  if (result.failures.length > 0) {
    for (const failure of result.failures) {
      logger.error(`Failed to create file: ${failure.path || "(N/A)"}`);
      logger.error(`  → ${failure.error}`);
      logger.error(`  → ${failure.message}`);
    }

    throw new Error(`Make failed with ${result.failures.length} failure(s)`);
  }

  logger.info(`Created file: ${config.outputFilePath}`);
}
