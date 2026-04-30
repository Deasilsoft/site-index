import type * as Vite from "vite";
import type { LoadedViteModule } from "./types.js";

export class ModuleRepository {
  readonly #modules = new Map<string, LoadedViteModule>();
  readonly #nodes = new Set<Vite.EnvironmentModuleNode>();
  readonly #watchedFiles = new Set<string>();

  getModule(importId: string): LoadedViteModule | undefined {
    return this.#modules.get(importId);
  }

  getWatchedFiles(): ReadonlySet<string> {
    return new Set(this.#watchedFiles);
  }

  addModule(module: LoadedViteModule): void {
    this.#modules.set(module.importId, module);
    this.#addNode(module.node);
  }

  #addNode(node: Vite.EnvironmentModuleNode): void {
    if (this.#nodes.has(node)) {
      return;
    }

    this.#nodes.add(node);

    if (typeof node.file === "string") {
      this.#watchedFiles.add(node.file);
    }

    for (const importedModule of node.importedModules) {
      this.#addNode(importedModule);
    }
  }

  reset(): void {
    this.#modules.clear();
    this.#nodes.clear();
    this.#watchedFiles.clear();
  }
}
