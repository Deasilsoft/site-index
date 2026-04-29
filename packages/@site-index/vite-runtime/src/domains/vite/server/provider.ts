import * as Vite from "vite";
import { makeServerConfig } from "./config.js";

export class ViteServerProvider {
  #isServerOwner = false;
  #server: Vite.ViteDevServer | undefined;
  #config: Vite.ResolvedConfig | undefined;

  constructor(config?: Vite.ResolvedConfig) {
    this.#config = config;
  }

  setConfig(config: Vite.ResolvedConfig): void {
    if (this.#server !== undefined) {
      throw new Error("Cannot set config if server is active");
    }

    this.#config = config;
  }

  attachServer(server: Vite.ViteDevServer): void {
    if (this.#server !== undefined) {
      throw new Error("Cannot attach server if another server is active");
    }

    this.#server = server;
    this.#config = server.config;
    this.#isServerOwner = false;
  }

  async getServer(): Promise<Vite.ViteDevServer> {
    if (this.#server !== undefined) {
      return this.#server;
    }

    if (this.#config === undefined) {
      throw new Error("Vite config could not be resolved");
    }

    this.#server = await Vite.createServer(makeServerConfig(this.#config));
    this.#isServerOwner = true;

    return this.#server;
  }

  getRootPath(): string {
    if (this.#config === undefined) {
      throw new Error("Vite config could not be resolved");
    }

    return this.#config.root;
  }

  async close(): Promise<void> {
    const server = this.#server;
    const isServerOwner = this.#isServerOwner;

    this.#server = undefined;
    this.#isServerOwner = false;

    if (server !== undefined && isServerOwner) {
      await server.close();
    }
  }
}
