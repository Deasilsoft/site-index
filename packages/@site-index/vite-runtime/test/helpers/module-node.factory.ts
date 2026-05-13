import type * as Vite from "vite";

export function createNode(
  file: string | null,
  importedModules: Vite.EnvironmentModuleNode[] = [],
): Vite.EnvironmentModuleNode {
  return {
    file,
    importedModules: new Set(importedModules),
  } as unknown as Vite.EnvironmentModuleNode;
}
