import * as SiteIndex from "@site-index/core";
import type { Options } from "../../types.js";
import { ModuleLoader } from "../module/loader.js";
import { WatchedFilesBuilder } from "../module/watched-files.builder.js";
import type { ServerConnection } from "../server/connection.js";
import { RuntimeSnapshot } from "./snapshot.js";

export class RuntimeService {
  readonly #options: Options;
  readonly #serverConnection: ServerConnection;
  #snapshot = RuntimeSnapshot.empty();
  #buildQueue: Promise<void> = Promise.resolve();

  constructor(options: Options, serverConnection: ServerConnection) {
    this.#options = options;
    this.#serverConnection = serverConnection;
  }

  async #runBuildArtifacts(): Promise<SiteIndex.Result<SiteIndex.Artifact[]>> {
    const watchedFilesBuilder = new WatchedFilesBuilder();
    const moduleLoader = new ModuleLoader({
      getServer: () => this.#serverConnection.getServer(),
      watchedFilesBuilder,
    });

    const result = await SiteIndex.main({
      siteUrl: this.#options.siteUrl,
      rootPath: this.#serverConnection.getRootPath(),
      extensions: this.#options.extensions,
      loadModule: moduleLoader.loadModule.bind(moduleLoader),
    });

    this.#snapshot = new RuntimeSnapshot({
      artifacts: result.data,
      watchedFiles: watchedFilesBuilder.build(),
    });

    return result;
  }

  async buildArtifacts(): Promise<SiteIndex.Result<SiteIndex.Artifact[]>> {
    const run = (async () => {
      await this.#buildQueue;

      return this.#runBuildArtifacts();
    })();

    this.#buildQueue = (async () => {
      try {
        await run;
      } catch (error) {
        void error;
      }
    })();

    return run;
  }

  getArtifacts(): readonly SiteIndex.Artifact[] {
    return this.#snapshot.getArtifacts();
  }

  getWatchedFiles(): ReadonlySet<string> {
    return this.#snapshot.getWatchedFiles();
  }

  async close(): Promise<void> {
    this.#snapshot = RuntimeSnapshot.empty();

    await this.#serverConnection.close();
  }
}
