import type * as SiteIndex from "@site-index/core";
import type * as Vite from "vite";
import { expect, vi } from "vitest";
import { ModuleLoader } from "../../src/domains/module/loader.js";
import { WatchedFilesBuilder } from "../../src/domains/module/watched-files.builder.js";
import { createNode } from "./module-node.factory.js";

type ModuleInput = SiteIndex.Module;
type SiteIndexModule = SiteIndex.ModuleExports;

type Harness = {
  service: ModuleLoader;
  getModuleByUrl: ReturnType<typeof vi.fn>;
  ssrLoadModule: ReturnType<typeof vi.fn>;
  createModuleInput(input?: Partial<ModuleInput>): ModuleInput;
  createSiteIndexModule(siteIndexes?: SiteIndex.SiteIndex[]): SiteIndexModule;
  mockCacheableSuccess(input?: {
    module?: ModuleInput;
    node?: Vite.EnvironmentModuleNode;
    moduleExports?: SiteIndexModule;
  }): {
    module: ModuleInput;
    node: Vite.EnvironmentModuleNode;
    moduleExports: SiteIndexModule;
  };
  mockUnresolvedThenResolved(input?: {
    module?: ModuleInput;
    node?: Vite.EnvironmentModuleNode;
    moduleExports?: SiteIndexModule;
  }): {
    module: ModuleInput;
    node: Vite.EnvironmentModuleNode;
    moduleExports: SiteIndexModule;
  };
  loadOnce(module?: ModuleInput): Promise<SiteIndexModule>;
  loadTwice(module?: ModuleInput): Promise<[SiteIndexModule, SiteIndexModule]>;
  expectLookupAndLoadCounts(lookups: number, loads: number): void;
};

function createSiteIndexModule(
  siteIndexes: SiteIndex.SiteIndex[] = [{ url: "/a" }],
): SiteIndexModule {
  return { siteIndexes };
}

export function createModuleLoaderSetup(): Harness {
  const getModuleByUrl = vi.fn();
  const ssrLoadModule = vi.fn();
  const defaultModule = {
    filePath: "/repo/src/routes/a.site-index.ts",
    importId: "./src/routes/a.site-index.ts",
  } satisfies ModuleInput;

  const service = new ModuleLoader({
    getServer: async () =>
      ({
        ssrLoadModule,
        environments: {
          ssr: {
            moduleGraph: {
              getModuleByUrl,
            },
          },
        },
      }) as unknown as Vite.ViteDevServer,
    watchedFilesBuilder: new WatchedFilesBuilder(),
  });

  function createModuleInput(input: Partial<ModuleInput> = {}): ModuleInput {
    return {
      filePath: input.filePath ?? defaultModule.filePath,
      importId: input.importId ?? defaultModule.importId,
    };
  }

  function mockCacheableSuccess(
    input: {
      module?: ModuleInput;
      node?: Vite.EnvironmentModuleNode;
      moduleExports?: SiteIndexModule;
    } = {},
  ): {
    module: ModuleInput;
    node: Vite.EnvironmentModuleNode;
    moduleExports: SiteIndexModule;
  } {
    const module = input.module ?? createModuleInput();
    const node = input.node ?? createNode(module.filePath);
    const moduleExports = input.moduleExports ?? createSiteIndexModule();

    getModuleByUrl.mockResolvedValue(node);
    ssrLoadModule.mockResolvedValue({ default: moduleExports });

    return { module, node, moduleExports };
  }

  function mockUnresolvedThenResolved(
    input: {
      module?: ModuleInput;
      node?: Vite.EnvironmentModuleNode;
      moduleExports?: SiteIndexModule;
    } = {},
  ): {
    module: ModuleInput;
    node: Vite.EnvironmentModuleNode;
    moduleExports: SiteIndexModule;
  } {
    const module = input.module ?? createModuleInput();
    const node = input.node ?? createNode(module.filePath);
    const moduleExports = input.moduleExports ?? createSiteIndexModule();
    const unresolvedModule: Vite.EnvironmentModuleNode | undefined = void 0;

    getModuleByUrl
      .mockResolvedValueOnce(unresolvedModule)
      .mockResolvedValueOnce(node);
    ssrLoadModule.mockResolvedValue({ default: moduleExports });

    return { module, node, moduleExports };
  }

  async function loadOnce(
    module = createModuleInput(),
  ): Promise<SiteIndexModule> {
    return service.loadModule(module);
  }

  async function loadTwice(
    module = createModuleInput(),
  ): Promise<[SiteIndexModule, SiteIndexModule]> {
    const first = await loadOnce(module);
    const second = await loadOnce(module);
    return [first, second];
  }

  function expectLookupAndLoadCounts(lookups: number, loads: number): void {
    expect(getModuleByUrl).toHaveBeenCalledTimes(lookups);
    expect(ssrLoadModule).toHaveBeenCalledTimes(loads);
  }

  return {
    service,
    getModuleByUrl,
    ssrLoadModule,
    createModuleInput,
    createSiteIndexModule,
    mockCacheableSuccess,
    mockUnresolvedThenResolved,
    loadOnce,
    loadTwice,
    expectLookupAndLoadCounts,
  };
}
