import type { RuntimeViteConfig } from "@site-index/vite-runtime";
import type { BaseConfig } from "./types.js";

export function makeResolvedViteConfig(config: BaseConfig): RuntimeViteConfig {
  return {
    root: config.rootPath,
    mode: "production",
    ...(config.configFile ? { configFile: config.configFile } : {}),
  };
}
