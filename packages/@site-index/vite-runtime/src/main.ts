import * as SiteIndex from "@site-index/core";
import * as Vite from "vite";

type Options = Pick<SiteIndex.Options, "siteUrl" | "extensions">;

const WATCHER_EVENTS = ["add", "change", "unlink"] as const;

type EmittedArtifact = { type: "asset"; fileName: string; source: string };

type PipelineState = Readonly<{
  buildArtifacts: readonly SiteIndex.Artifact[];
  serveArtifacts: Map<string, SiteIndex.Artifact>;
  viteConfig: Vite.ResolvedConfig | undefined;
  watchables: ReadonlySet<string> | undefined;
}>;

export type ViteSiteIndexPipelineService = {
  setViteConfig(viteConfig: Vite.ResolvedConfig): void;
  prepareArtifacts(): Promise<void>;
  publishArtifacts(): void;
  configureServer(server: Vite.ViteDevServer): void;
  getServeArtifacts(): ReadonlyMap<string, SiteIndex.Artifact>;
  onWarning(listener: (message: string) => void): () => void;
  onError(listener: (error: unknown) => void): () => void;
  onArtifact(listener: (artifact: EmittedArtifact) => void): () => void;
};

type RunSiteIndexInput = {
  siteUrl: string;
  rootPath: string;
  extensions: string[] | undefined;
};

type RunSiteIndexOutput = {
  artifacts: SiteIndex.Artifact[];
  loadedModules: SiteIndex.LoadedModule[];
};

type RefreshedEvent = {
  artifacts: SiteIndex.Artifact[];
  loadedModules: SiteIndex.LoadedModule[];
};

export type ViteSiteIndexService = {
  ensureServer(): Promise<Vite.ViteDevServer>;
  close(): Promise<void>;
  runSiteIndex(input: RunSiteIndexInput): Promise<RunSiteIndexOutput>;
  collectFiles(modules: readonly SiteIndex.Module[]): Promise<Set<string>>;
  onRefreshed(listener: (event: RefreshedEvent) => void): () => void;
  onWarning(listener: (warning: SiteIndex.Warning) => void): () => void;
  onError(listener: (error: unknown) => void): () => void;
  loadModule: SiteIndex.ModuleLoader;
  getLoadedModules(): SiteIndex.LoadedModule[];
  resetLoadedModules(): void;
};

type ViteSiteIndexState = Readonly<{
  server: Vite.ViteDevServer | undefined;
  loadedModules: ReadonlyMap<string, SiteIndex.LoadedModule>;
  ownsServer: boolean;
  viteConfig: Vite.ResolvedConfig | undefined;
}>;

type MakeViteSiteIndexServiceInput =
  | { server: Vite.ViteDevServer }
  | { viteConfig: Vite.ResolvedConfig };

function makeServerConfig(viteConfig: Vite.ResolvedConfig): Vite.InlineConfig {
  const serverConfig: Vite.InlineConfig = {
    root: viteConfig.root,
    mode: viteConfig.mode,
    appType: "custom",
    server: {
      middlewareMode: true,
      hmr: false,
    },
  };

  if (viteConfig.configFile !== undefined) {
    serverConfig.configFile = viteConfig.configFile;
  }

  return serverConfig;
}

export function makeViteSiteIndexService(
  input: MakeViteSiteIndexServiceInput,
): ViteSiteIndexService {
  const refreshedListeners = new Set<(event: RefreshedEvent) => void>();
  const warningListeners = new Set<(warning: SiteIndex.Warning) => void>();
  const errorListeners = new Set<(error: unknown) => void>();

  let state: ViteSiteIndexState =
    "server" in input
      ? {
          server: input.server,
          loadedModules: new Map<string, SiteIndex.LoadedModule>(),
          ownsServer: false,
          viteConfig: undefined,
        }
      : {
          server: undefined,
          loadedModules: new Map<string, SiteIndex.LoadedModule>(),
          ownsServer: true,
          viteConfig: input.viteConfig,
        };

  function onRefreshed(listener: (event: RefreshedEvent) => void): () => void {
    refreshedListeners.add(listener);

    return () => {
      refreshedListeners.delete(listener);
    };
  }

  function onWarning(
    listener: (warning: SiteIndex.Warning) => void,
  ): () => void {
    warningListeners.add(listener);

    return () => {
      warningListeners.delete(listener);
    };
  }

  function onError(listener: (error: unknown) => void): () => void {
    errorListeners.add(listener);

    return () => {
      errorListeners.delete(listener);
    };
  }

  function emitRefreshed(event: RefreshedEvent): void {
    for (const listener of refreshedListeners) {
      listener(event);
    }
  }

  function emitWarning(warning: SiteIndex.Warning): void {
    for (const listener of warningListeners) {
      listener(warning);
    }
  }

  function emitError(error: unknown): void {
    for (const listener of errorListeners) {
      listener(error);
    }
  }

  async function ensureServer(): Promise<Vite.ViteDevServer> {
    if (state.server !== undefined) {
      return state.server;
    }

    if (state.viteConfig === undefined) {
      throw new Error("Vite config could not be resolved");
    }

    const server = await Vite.createServer(makeServerConfig(state.viteConfig));
    state = {
      ...state,
      server,
    };

    return server;
  }

  async function close(): Promise<void> {
    if (state.server === undefined || !state.ownsServer) {
      return;
    }

    const server = state.server;
    state = {
      ...state,
      server: undefined,
    };

    await server.close();
  }

  async function loadModule(
    module: SiteIndex.Module,
  ): Promise<SiteIndex.ModuleExports> {
    const loadedModule = state.loadedModules.get(module.importId);

    if (loadedModule !== undefined) {
      return loadedModule;
    }

    const server = await ensureServer();
    const moduleExports = (await server.ssrLoadModule(module.importId))
      .default satisfies SiteIndex.ModuleExports;

    const nextLoadedModule: SiteIndex.LoadedModule = {
      ...module,
      ...moduleExports,
    };
    const nextLoadedModules = new Map(state.loadedModules);
    nextLoadedModules.set(module.importId, nextLoadedModule);

    state = {
      ...state,
      loadedModules: nextLoadedModules,
    };

    return moduleExports;
  }

  function getLoadedModules(): SiteIndex.LoadedModule[] {
    return [...state.loadedModules.values()];
  }

  function resetLoadedModules(): void {
    state = {
      ...state,
      loadedModules: new Map<string, SiteIndex.LoadedModule>(),
    };
  }

  async function collectFiles(
    modules: readonly SiteIndex.Module[],
  ): Promise<Set<string>> {
    const files = new Set<string>();
    const visited = new Set<Vite.EnvironmentModuleNode>();
    const server = await ensureServer();
    const getModuleByUrl = server.environments.ssr.moduleGraph.getModuleByUrl;

    function visit(node: Vite.EnvironmentModuleNode): void {
      if (visited.has(node)) {
        return;
      }

      visited.add(node);

      if (node.file !== null) {
        files.add(node.file);
      }

      for (const importedModule of node.importedModules) {
        visit(importedModule);
      }
    }

    for (const module of modules) {
      const node = await getModuleByUrl(module.importId);

      if (node !== undefined) {
        visit(node);
      }
    }

    return files;
  }

  async function runSiteIndex(
    input: RunSiteIndexInput,
  ): Promise<RunSiteIndexOutput> {
    resetLoadedModules();

    try {
      const result = await SiteIndex.main({
        siteUrl: input.siteUrl,
        rootPath: input.rootPath,
        extensions: input.extensions,
        loadModule,
      });

      for (const warning of result.warnings) {
        emitWarning(warning);
      }

      const output = {
        artifacts: result.data,
        loadedModules: getLoadedModules(),
      };

      emitRefreshed({
        artifacts: output.artifacts,
        loadedModules: output.loadedModules,
      });

      return output;
    } catch (error) {
      emitError(error);
      throw error;
    }
  }

  return {
    ensureServer,
    close,
    runSiteIndex,
    collectFiles,
    onRefreshed,
    onWarning,
    onError,
    loadModule,
    getLoadedModules,
    resetLoadedModules,
  };
}

function toRequestPath(filePath: string): string {
  return filePath.startsWith("/") ? filePath : `/${filePath}`;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function makeViteSiteIndexPipelineService(
  options: Options,
  pluginName: string,
): ViteSiteIndexPipelineService {
  const warningListeners = new Set<(message: string) => void>();
  const errorListeners = new Set<(error: unknown) => void>();
  const artifactListeners = new Set<(artifact: EmittedArtifact) => void>();

  let state: PipelineState = {
    buildArtifacts: [],
    serveArtifacts: new Map<string, SiteIndex.Artifact>(),
    viteConfig: undefined,
    watchables: undefined,
  };

  function emitWarning(message: string): void {
    for (const listener of warningListeners) {
      listener(message);
    }
  }

  function emitError(error: unknown): void {
    for (const listener of errorListeners) {
      listener(error);
    }
  }

  function emitArtifact(artifact: EmittedArtifact): void {
    for (const listener of artifactListeners) {
      listener(artifact);
    }
  }

  function onWarning(listener: (message: string) => void): () => void {
    warningListeners.add(listener);

    return () => {
      warningListeners.delete(listener);
    };
  }

  function onError(listener: (error: unknown) => void): () => void {
    errorListeners.add(listener);

    return () => {
      errorListeners.delete(listener);
    };
  }

  function onArtifact(
    listener: (artifact: EmittedArtifact) => void,
  ): () => void {
    artifactListeners.add(listener);

    return () => {
      artifactListeners.delete(listener);
    };
  }

  function setViteConfig(viteConfig: Vite.ResolvedConfig): void {
    state = {
      ...state,
      viteConfig,
    };
  }

  function getServeArtifacts(): ReadonlyMap<string, SiteIndex.Artifact> {
    return state.serveArtifacts;
  }

  async function prepareArtifacts(): Promise<void> {
    if (state.viteConfig === undefined) {
      throw new Error(`[${pluginName}] Vite config could not be resolved`);
    }

    const runtime = makeViteSiteIndexService({ viteConfig: state.viteConfig });
    const unsubscribeWarning = runtime.onWarning((warning) => {
      emitWarning(warning.message);
    });
    const unsubscribeError = runtime.onError((error) => {
      emitError(error);
    });

    try {
      const result = await runtime.runSiteIndex({
        siteUrl: options.siteUrl,
        rootPath: state.viteConfig.root,
        extensions: options.extensions,
      });

      state = {
        ...state,
        buildArtifacts: result.artifacts.map((artifact) => ({ ...artifact })),
      };
    } finally {
      unsubscribeWarning();
      unsubscribeError();
      await runtime.close();
    }
  }

  function publishArtifacts(): void {
    for (const artifact of state.buildArtifacts) {
      emitArtifact({
        type: "asset",
        fileName: artifact.filePath,
        source: artifact.content,
      });
    }
  }

  function configureServer(server: Vite.ViteDevServer): void {
    if (state.viteConfig === undefined) {
      throw new Error(`[${pluginName}] Vite config could not be resolved`);
    }

    const runtime = makeViteSiteIndexService({ server });
    const viteConfig = state.viteConfig;
    let inFlight: Promise<void> | null = null;
    let rerunRequested = false;

    const unsubscribeWarning = runtime.onWarning((warning) => {
      emitWarning(warning.message);
      server.config.logger.warn(warning.message);
    });
    const unsubscribeError = runtime.onError((error) => {
      emitError(error);
      server.config.logger.error(
        `Failed to generate site-index artifacts: ${toErrorMessage(error)}`,
      );
    });

    async function refresh(): Promise<void> {
      let refreshed;

      try {
        refreshed = await runtime.runSiteIndex({
          siteUrl: options.siteUrl,
          rootPath: viteConfig.root,
          extensions: options.extensions,
        });
      } catch {
        return;
      }

      const watchables = await runtime.collectFiles(refreshed.loadedModules);

      state.serveArtifacts.clear();
      for (const artifact of refreshed.artifacts) {
        state.serveArtifacts.set(toRequestPath(artifact.filePath), {
          ...artifact,
        });
      }

      state = {
        ...state,
        watchables: new Set(watchables),
      };
    }

    async function runRefresh(): Promise<void> {
      do {
        rerunRequested = false;
        await refresh();
      } while (rerunRequested);
    }

    function requestRefresh(): Promise<void> {
      if (inFlight !== null) {
        rerunRequested = true;
        return inFlight;
      }

      inFlight = runRefresh().finally(() => {
        inFlight = null;
      });

      return inFlight;
    }

    function handleWatcherEvent(filePath: string): void {
      if (state.watchables === undefined || !state.watchables.has(filePath)) {
        return;
      }

      void requestRefresh();
    }

    for (const event of WATCHER_EVENTS) {
      server.watcher.on(event, handleWatcherEvent);
    }

    server.httpServer?.once("close", () => {
      for (const event of WATCHER_EVENTS) {
        server.watcher.off(event, handleWatcherEvent);
      }

      unsubscribeWarning();
      unsubscribeError();
    });

    void requestRefresh();
  }

  return {
    setViteConfig,
    prepareArtifacts,
    publishArtifacts,
    configureServer,
    getServeArtifacts,
    onWarning,
    onError,
    onArtifact,
  };
}
