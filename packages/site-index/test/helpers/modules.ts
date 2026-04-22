import type { LoadedModule, Module } from "../../src/index.js";

export function createLoadedModules(
  modules: Module[],
  byImportId: Map<string, unknown>,
): LoadedModule[] {
  return modules.map((module) => {
    return {
      module,
      exports: byImportId.get(module.importId) ?? { default: [] },
    };
  }) as unknown as LoadedModule[];
}
