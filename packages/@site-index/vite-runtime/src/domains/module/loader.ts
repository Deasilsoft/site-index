import type * as SiteIndex from "@site-index/core";
import type * as Vite from "vite";
import type { LoadedViteModule } from "./types.js";
import type { WatchedFilesBuilder } from "./watched-files.builder.js";

type Input = {
  getServer: () => Promise<Vite.ViteDevServer>;
  watchedFilesBuilder: WatchedFilesBuilder;
};

export class ModuleLoader {
  readonly #modules = new Map<string, LoadedViteModule>();
  readonly #getServer: () => Promise<Vite.ViteDevServer>;
  readonly #watchedFilesBuilder: WatchedFilesBuilder;

  constructor(input: Input) {
    this.#getServer = input.getServer;
    this.#watchedFilesBuilder = input.watchedFilesBuilder;
  }

  async loadModule(module: SiteIndex.Module): Promise<SiteIndex.ModuleExports> {
    const cachedModule = this.#modules.get(module.importId);

    if (cachedModule !== undefined) {
      return cachedModule;
    }

    const server = await this.#getServer();
    const loadedModule = await server.ssrLoadModule(module.importId);
    const moduleExports = loadedModule.default as SiteIndex.ModuleExports;
    const getModuleByUrl = server.environments.ssr.moduleGraph.getModuleByUrl;
    const node = await getModuleByUrl(module.importId);

    if (node === undefined) {
      throw new Error(`Unable to resolve loaded module "${module.importId}"`);
    }

    this.#modules.set(module.importId, { ...module, ...moduleExports, node });
    this.#watchedFilesBuilder.addModuleNode(node);

    return moduleExports;
  }
}
