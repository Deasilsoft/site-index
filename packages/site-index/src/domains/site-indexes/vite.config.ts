import type * as Vite from "vite";
import type { BaseConfig } from "./types.js";

export function makeResolvedViteConfig(
  config: BaseConfig,
): Vite.ResolvedConfig {
  return {
    root: config.rootPath,
    mode: "production",
    ...(config.configFile ? { configFile: config.configFile } : {}),
  } as Vite.ResolvedConfig;
}
