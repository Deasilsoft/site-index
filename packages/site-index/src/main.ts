import { makeArtifacts } from "./domains/artifacts/make.artifacts.js";
import type { Artifact } from "./domains/artifacts/types.js";
import { resolveOptions } from "./domains/options/options.resolve.js";
import type { Options } from "./domains/options/types.js";
import { discoverModules } from "./domains/site-indexes/modules.discovery.js";
import { loadModules } from "./domains/site-indexes/modules.load.js";
import { resolveModules } from "./domains/site-indexes/modules.resolve.js";
import { resolveSiteIndexes } from "./domains/site-indexes/site-indexes.resolve.js";
import type { Result, Warning } from "./shared/types.js";

export async function main(options: Options): Promise<Result<Artifact[]>> {
  const warnings: Warning[] = [];
  const config = resolveOptions(options);
  const modules = await discoverModules(config.rootPath, config.extensions);

  if (modules.length === 0) {
    warnings.push({
      message: `No modules found in: ${config.rootPath}`,
    });

    return {
      data: [],
      warnings,
    };
  }

  const loadedModules = await loadModules(modules, config.loadModule);
  const resolvedModules = resolveModules(loadedModules.data);
  const resolvedSiteIndexes = resolveSiteIndexes(resolvedModules.data);

  warnings.push(...loadedModules.warnings);
  warnings.push(...resolvedModules.warnings);
  warnings.push(...resolvedSiteIndexes.warnings);

  return {
    data: makeArtifacts(config.siteUrl, resolvedSiteIndexes.data),
    warnings,
  };
}
