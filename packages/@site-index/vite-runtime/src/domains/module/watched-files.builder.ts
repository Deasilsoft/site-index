import type * as Vite from "vite";
import { WatchedFiles } from "./watched-files.js";

export class WatchedFilesBuilder {
  readonly #nodes = new Set<Vite.EnvironmentModuleNode>();
  readonly #files = new Set<string>();

  addModuleNode(node: Vite.EnvironmentModuleNode): void {
    if (this.#nodes.has(node)) {
      return;
    }

    this.#nodes.add(node);

    if (typeof node.file === "string") {
      this.#files.add(node.file);
    }

    for (const importedModule of node.importedModules) {
      this.addModuleNode(importedModule);
    }
  }

  build(): WatchedFiles {
    return new WatchedFiles(this.#files);
  }
}
