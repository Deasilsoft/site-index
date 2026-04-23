import type { Result, Warning } from "../../shared/types.js";
import type { ModuleLoader } from "../options/types.js";
import type { LoadedModule, Module } from "./types.js";

export async function loadModules(
  modules: Module[],
  loadModule: ModuleLoader,
): Promise<Result<LoadedModule[]>> {
  const data: LoadedModule[] = [];
  const warnings: Warning[] = [];

  for (const module of modules) {
    try {
      const exports = await loadModule(module);

      data.push({
        importId: module.importId,
        filePath: module.filePath,
        siteIndexes: exports.siteIndexes,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      warnings.push({
        message: `Failed to load module "${module.filePath}" (${module.importId}): ${message}`,
        filePath: module.filePath,
      });
    }
  }

  return { data, warnings };
}
