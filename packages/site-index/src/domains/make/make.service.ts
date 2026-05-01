import { logger } from "../../shared/logging/logger.js";
import { fileExists } from "../../shared/utils/fs.js";
import { makeSiteIndexModule } from "./adapters/site-index.js";
import type { MakeConfig } from "./types.js";

export async function runMake(config: MakeConfig): Promise<void> {
  if ((await fileExists(config.outputFilePath)) && !config.force) {
    throw new Error(
      `Refusing to overwrite existing file: ${config.outputFilePath} (use --force)`,
    );
  }

  await makeSiteIndexModule({
    filePath: config.outputFilePath,
    format: config.format,
    lastModified: new Date().toISOString(),
  });

  logger.info(`Created file: ${config.outputFilePath}`);
}
