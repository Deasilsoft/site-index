import type * as Vite from "vite";
import type { ServerConnection } from "./connection.js";

export class ExistingServerConnection implements ServerConnection {
  readonly #server: Vite.ViteDevServer;

  constructor(server: Vite.ViteDevServer) {
    this.#server = server;
  }

  async getServer(): Promise<Vite.ViteDevServer> {
    return this.#server;
  }

  getRootPath(): string {
    return this.#server.config.root;
  }

  async close(): Promise<void> {}
}
