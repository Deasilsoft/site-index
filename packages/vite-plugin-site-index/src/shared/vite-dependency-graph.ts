import * as Vite from "vite";

export async function collectRelevantFiles(
  server: Vite.ViteDevServer,
  entryImportIds: Iterable<string>,
): Promise<Set<string>> {
  const files = new Set<string>();
  const visited = new Set<Vite.EnvironmentModuleNode>();

  async function visitById(id: string): Promise<void> {
    const mod = await server.environments.ssr.moduleGraph.getModuleByUrl(id);

    if (!mod) {
      return;
    }

    visit(mod);
  }

  function visit(mod: Vite.EnvironmentModuleNode): void {
    if (visited.has(mod)) {
      return;
    }

    visited.add(mod);

    if (mod.file) {
      files.add(mod.file);
    }

    for (const imported of mod.importedModules) {
      visit(imported);
    }
  }

  for (const id of entryImportIds) {
    await visitById(id);
  }

  return files;
}
