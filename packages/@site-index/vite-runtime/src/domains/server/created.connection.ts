import * as Vite from "vite";
import type { RuntimeViteConfig } from "../../types.js";
import type { ServerConnection } from "./connection.js";
import { makeServerConfig } from "./config.js";

export class CreatedServerConnection implements ServerConnection {
  readonly #config: RuntimeViteConfig;
  #server: Vite.ViteDevServer | undefined;

  constructor(config: RuntimeViteConfig) {
    this.#config = config;
  }

  async getServer(): Promise<Vite.ViteDevServer> {
    this.#server ??= await Vite.createServer(makeServerConfig(this.#config));

    return this.#server;
  }

  getRootPath(): string {
    return this.#config.root;
  }

  async close(): Promise<void> {
    const server = this.#server;
    this.#server = undefined;

    await server?.close();
  }
}
