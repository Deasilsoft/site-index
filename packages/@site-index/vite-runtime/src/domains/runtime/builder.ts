import type { Options, RuntimeViteConfig } from "../../types.js";
import { RuntimeService } from "./service.js";

export class RuntimeServiceBuilder {
  #options: Options | undefined;
  #viteConfig: RuntimeViteConfig | undefined;

  withOptions(options: Options): this {
    this.#options = options;

    return this;
  }

  withViteConfig(config: RuntimeViteConfig): this {
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
