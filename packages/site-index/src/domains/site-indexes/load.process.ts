import type { Result, Warning } from "../../shared/types.js";
import type { LoadedModule, Module } from "./types.js";
import type { LoadModule } from "../options/types.js";

export async function loadModules(
  modules: Module[],
  loadModule: LoadModule,
): Promise<Result<LoadedModule[]>> {
  const data: LoadedModule[] = [];
  const warnings: Warning[] = [];

  for (const module of modules) {
    try {
      const exports = await loadModule(module);

      data.push({
        module,
        exports,
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
