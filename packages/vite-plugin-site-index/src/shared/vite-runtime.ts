import type { ModuleLoader } from "site-index";
import * as Vite from "vite";

function makeMiddlewareServerConfig(
  viteConfig: Vite.ResolvedConfig,
): Vite.InlineConfig {
  const serverConfig: Vite.InlineConfig = {
    root: viteConfig.root,
    mode: viteConfig.mode,
    appType: "custom",
    server: {
      middlewareMode: true,
    },
  };

  if (viteConfig.configFile !== undefined) {
    serverConfig.configFile = viteConfig.configFile;
  }

  return serverConfig;
}

export async function makeRuntimeServer(
  viteConfig: Vite.ResolvedConfig,
): Promise<Vite.ViteDevServer> {
  return Vite.createServer(makeMiddlewareServerConfig(viteConfig));
}

export async function loadRuntimeModuleDefault(
  server: Vite.ViteDevServer,
  importId: string,
): Promise<unknown> {
  return (await server.ssrLoadModule(importId)).default;
}

export function makeTrackingModuleLoader(server: Vite.ViteDevServer): {
  loadModule: ModuleLoader;
  loadedImportIds: Set<string>;
} {
  const loadedImportIds = new Set<string>();

  return {
    loadedImportIds,
    loadModule: async (module) => {
      loadedImportIds.add(module.importId);
      return loadRuntimeModuleDefault(server, module.importId);
    },
  };
}
