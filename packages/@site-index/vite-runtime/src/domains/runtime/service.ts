import * as SiteIndex from "@site-index/core";
import type * as Vite from "vite";
import type { Options } from "../../types.js";
import { ArtifactsRepository } from "../artifacts/repository.js";
import { ModuleService } from "../vite/modules/service.js";
import { ViteServerProvider } from "../vite/server/provider.js";

export class RuntimeService {
  readonly #options: Options;
  readonly #artifactsRepository: ArtifactsRepository;
  readonly #serverProvider: ViteServerProvider;
  readonly #moduleService: ModuleService;

  constructor(options: Options, viteConfig?: Vite.ResolvedConfig) {
    this.#options = options;
    this.#artifactsRepository = new ArtifactsRepository();
    this.#serverProvider = new ViteServerProvider(viteConfig);
    this.#moduleService = new ModuleService(() => {
      return this.#serverProvider.getServer();
    });
  }

  setViteConfig(config: Vite.ResolvedConfig): void {
    this.#serverProvider.setConfig(config);
  }

  attachViteServer(server: Vite.ViteDevServer): void {
    this.#serverProvider.attachServer(server);
  }

  async buildArtifacts(): Promise<SiteIndex.Result<SiteIndex.Artifact[]>> {
    this.#moduleService.reset();

    const result = await SiteIndex.main({
      siteUrl: this.#options.siteUrl,
      rootPath: this.#serverProvider.getRootPath(),
      extensions: this.#options.extensions,
      loadModule: this.#moduleService.loadModule.bind(this.#moduleService),
    });

    this.#artifactsRepository.setArtifacts(result.data);

    return result;
  }

  getArtifacts(): readonly SiteIndex.Artifact[] {
    return this.#artifactsRepository.getArtifacts();
  }

  getWatchedFiles(): ReadonlySet<string> {
    return this.#moduleService.getWatchedFiles();
  }

  async close(): Promise<void> {
    this.#artifactsRepository.reset();
    this.#moduleService.reset();
    await this.#serverProvider.close();
  }
}
