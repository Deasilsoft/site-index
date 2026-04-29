import type * as SiteIndex from "@site-index/core";

export class ArtifactsRepository {
  readonly #artifacts: SiteIndex.Artifact[] = [];

  setArtifacts(next: readonly SiteIndex.Artifact[]): void {
    this.reset();

    for (const artifact of next) {
      this.#artifacts.push({ ...artifact });
    }
  }

  getArtifacts(): readonly SiteIndex.Artifact[] {
    return this.#artifacts.map((artifact) => ({ ...artifact }));
  }

  reset(): void {
    this.#artifacts.length = 0;
  }
}
