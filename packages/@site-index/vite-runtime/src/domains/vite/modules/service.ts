import type * as SiteIndex from "@site-index/core";
import type * as Vite from "vite";
import { ModuleRepository } from "./repository.js";

export class ModuleService {
  readonly #repository: ModuleRepository;
  readonly #getServer: () => Promise<Vite.ViteDevServer>;

  constructor(getServer: () => Promise<Vite.ViteDevServer>) {
    this.#repository = new ModuleRepository();
    this.#getServer = getServer;
  }

  async loadModule(
    module: SiteIndex.Module,
  ): Promise<SiteIndex.SiteIndexModule> {
    const cachedModule = this.#repository.getModule(module.importId);

    if (cachedModule !== undefined) {
      return cachedModule;
    }

    const server = await this.#getServer();
    const loadedModule = await server.ssrLoadModule(module.importId);
    const siteIndexModule = loadedModule.default as SiteIndex.SiteIndexModule;
    const getModuleByUrl = server.environments.ssr.moduleGraph.getModuleByUrl;
    const node = await getModuleByUrl(module.importId);

    if (node === undefined) {
      throw new Error(`Unable to resolve loaded module "${module.importId}"`);
    }

    this.#repository.addModule({
      ...module,
      ...siteIndexModule,
      node,
    });

    return siteIndexModule;
  }

  getWatchedFiles(): ReadonlySet<string> {
    return this.#repository.getWatchedFiles();
  }

  reset(): void {
    this.#repository.reset();
  }
}
