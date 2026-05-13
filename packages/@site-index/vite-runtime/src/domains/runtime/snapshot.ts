import type * as SiteIndex from "@site-index/core";
import { WatchedFiles } from "../module/watched-files.js";

type Input = {
  artifacts: readonly SiteIndex.Artifact[];
  watchedFiles: WatchedFiles;
};

export class RuntimeSnapshot {
  readonly #artifacts: readonly SiteIndex.Artifact[];
  readonly #watchedFiles: WatchedFiles;

  constructor(input: Input) {
    this.#artifacts = [...input.artifacts];
    this.#watchedFiles = input.watchedFiles;
  }

  getArtifacts(): readonly SiteIndex.Artifact[] {
    return [...this.#artifacts];
  }

  getWatchedFiles(): ReadonlySet<string> {
    return this.#watchedFiles.getFiles();
  }

  static empty(): RuntimeSnapshot {
    return new RuntimeSnapshot({
      artifacts: [],
      watchedFiles: WatchedFiles.empty(),
    });
  }
}
