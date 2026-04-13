import path from "node:path";
import {
  createServer,
  loadConfigFromFile,
  mergeConfig,
  type ViteDevServer,
} from "vite";

export type ModuleLoaderContext = {
  root: string;
  ssrLoadModule: (id: string) => Promise<unknown>;
};

type ModuleLoaderContextHandle = {
  moduleLoaderContext: ModuleLoaderContext;
  dispose: () => Promise<void>;
};

function resolveViteRoot(processRoot: string, configuredRoot?: string): string {
  if (!configuredRoot) {
    return processRoot;
  }

  return path.resolve(processRoot, configuredRoot);
}

function createContextFromServer(
  root: string,
  server: ViteDevServer,
): ModuleLoaderContext {
  return {
    root,
    ssrLoadModule: (id) => server.ssrLoadModule(id),
  };
}

export async function resolveModuleLoaderContext(
  context?: ModuleLoaderContext,
): Promise<ModuleLoaderContextHandle> {
  if (context) {
    return { moduleLoaderContext: context, dispose: async () => {} };
  }

  const processRoot = process.cwd();
  const loadedConfig = await loadConfigFromFile(
    {
      command: "build",
      mode: "production",
      isSsrBuild: true,
      isPreview: false,
    },
    undefined,
    processRoot,
  );

  const root = resolveViteRoot(processRoot, loadedConfig?.config.root);
  const server = await createServer(
    mergeConfig(loadedConfig?.config ?? {}, {
      configFile: false,
      appType: "custom",
      logLevel: "error",
      root,
      server: { middlewareMode: true },
    }),
  );

  return {
    moduleLoaderContext: createContextFromServer(root, server),
    dispose: () => server.close(),
  };
}
