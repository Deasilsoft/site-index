export class WatchedFiles {
  readonly #files: ReadonlySet<string>;

  constructor(files: Iterable<string>) {
    this.#files = new Set(files);
  }

  getFiles(): ReadonlySet<string> {
    return new Set(this.#files);
  }

  static empty(): WatchedFiles {
    return new WatchedFiles([]);
  }
}
