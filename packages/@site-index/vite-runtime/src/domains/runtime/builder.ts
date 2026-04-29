import type * as Vite from "vite";
import type { Options } from "../../types.js";
import { RuntimeService } from "./service.js";

export class RuntimeServiceBuilder {
  #options: Options | undefined;
  #viteConfig: Vite.ResolvedConfig | undefined;

  withOptions(options: Options): this {
    this.#options = options;
    return this;
  }

  withViteConfig(config: Vite.ResolvedConfig): this {
    this.#viteConfig = config;
    return this;
  }

  build(): RuntimeService {
    if (this.#options === undefined) {
      throw new Error("Options must be provided to build the RuntimeService.");
    }

    return new RuntimeService(this.#options, this.#viteConfig);
  }
}
