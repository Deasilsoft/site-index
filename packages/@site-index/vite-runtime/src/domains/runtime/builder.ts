import type * as Vite from "vite";
import type { Options, RuntimeViteConfig } from "../../types.js";
import { CreatedServerConnection } from "../server/created.connection.js";
import { ExistingServerConnection } from "../server/existing.connection.js";
import type { ServerConnection } from "../server/connection.js";
import { RuntimeService } from "./service.js";

export class RuntimeServiceBuilder {
  #options: Options | undefined;
  #serverConnection: ServerConnection | undefined;

  withOptions(options: Options): this {
    this.#options = options;

    return this;
  }

  withViteConfig(config: RuntimeViteConfig): this {
    this.#serverConnection = new CreatedServerConnection(config);

    return this;
  }

  withViteServer(server: Vite.ViteDevServer): this {
    this.#serverConnection = new ExistingServerConnection(server);

    return this;
  }

  build(): RuntimeService {
    if (this.#options === undefined) {
      throw new Error("Options must be provided to build the RuntimeService.");
    }

    if (this.#serverConnection === undefined) {
      throw new Error(
        "Vite server or config must be provided to build the RuntimeService.",
      );
    }

    return new RuntimeService(this.#options, this.#serverConnection);
  }
}
