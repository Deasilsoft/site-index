import * as Vite from "vite";
import type { RuntimeViteConfig } from "../../../types.js";

export function makeServerConfig(input: RuntimeViteConfig): Vite.InlineConfig {
  const output: Vite.InlineConfig = {
    root: input.root,
    mode: input.mode,
    appType: "custom",
    server: {
      middlewareMode: true,
      hmr: false,
    },
  };

  if (input.configFile !== undefined) {
    output.configFile = input.configFile;
  }

  return output;
}
