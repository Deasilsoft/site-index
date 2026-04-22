import { type Artifact, makeArtifacts } from "./domains/artifacts/index.js";
import { type Options, validateOptions } from "./domains/options/index.js";
import {
  discoverModules,
  loadModules,
  validateModules,
  validateSiteIndexes,
} from "./domains/site-indexes/index.js";
import type { Result } from "./shared/index.js";

export async function runSiteIndexPipeline(
  options: Options,
): Promise<Result<Artifact[]>> {
  const config = validateOptions(options);
  const modules = await discoverModules(config.rootPath, config.extensions);

  if (modules.length === 0) {
    return {
      data: [],
      warnings: [
        {
          message: `No modules found in: ${config.rootPath}`,
        },
      ],
    };
  }

  const loadedModules = await loadModules(modules, config.loadModule);
  const validatedModules = validateModules(loadedModules.data);
  const validatedSiteIndexes = validateSiteIndexes(validatedModules.data);

  return {
    data: makeArtifacts(config.siteUrl, validatedSiteIndexes.data),
    warnings: [
      ...loadedModules.warnings,
      ...validatedModules.warnings,
      ...validatedSiteIndexes.warnings,
    ],
  };
}
