import type * as SiteIndex from "@site-index/core";
import type * as Vite from "vite";
import type { WatchedFilesBuilder } from "./watched-files.builder.js";

type Input = {
  getServer: () => Promise<Vite.ViteDevServer>;
  watchedFilesBuilder: WatchedFilesBuilder;
};

export class ModuleLoader {
  readonly #moduleExports = new Map<string, SiteIndex.ModuleExports>();
  readonly #getServer: () => Promise<Vite.ViteDevServer>;
  readonly #watchedFilesBuilder: WatchedFilesBuilder;

  constructor(input: Input) {
    this.#getServer = input.getServer;
    this.#watchedFilesBuilder = input.watchedFilesBuilder;
  }

  async loadModule(module: SiteIndex.Module): Promise<SiteIndex.ModuleExports> {
    const cachedModuleExports = this.#moduleExports.get(module.importId);

    if (cachedModuleExports !== undefined) {
      return cachedModuleExports;
    }

    const server = await this.#getServer();
    const loadedModule = await server.ssrLoadModule(module.importId);
    const moduleExports = loadedModule.default as SiteIndex.ModuleExports;
    const getModuleByUrl = server.environments.ssr.moduleGraph.getModuleByUrl;
    const node = await getModuleByUrl(module.importId);

    if (node === undefined) {
      throw new Error(`Unable to resolve loaded module "${module.importId}"`);
    }

    this.#moduleExports.set(module.importId, moduleExports);
    this.#watchedFilesBuilder.addModuleNode(node);

    return moduleExports;
  }
}
