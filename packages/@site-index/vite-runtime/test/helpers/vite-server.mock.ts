import type * as SiteIndex from "@site-index/core";
import type * as Vite from "vite";
import { vi } from "vitest";

type Input = {
  root?: string;
  modulesByUrl?: Record<string, Vite.EnvironmentModuleNode | undefined>;
};

export function createViteServerMock(input: Input = {}) {
  const moduleNodesByUrl = new Map<string, Vite.EnvironmentModuleNode>();
  const lookedUpUrls: string[] = [];

  if (input.modulesByUrl !== undefined) {
    for (const [url, node] of Object.entries(input.modulesByUrl)) {
      if (node !== undefined) {
        moduleNodesByUrl.set(url, node);
      }
    }
  }

  const getModuleByUrl = vi.fn(async (url: string) => {
    lookedUpUrls.push(url);
    return moduleNodesByUrl.get(url);
  });

  const defaultModule: SiteIndex.ModuleExports = {
    siteIndexes: [{ url: "/default" }],
  };
  type SsrLoadModule = (
    importId: string,
  ) => Promise<{ default: SiteIndex.ModuleExports }>;

  const ssrLoadModule = vi.fn<SsrLoadModule>();
  ssrLoadModule.mockResolvedValue({
    default: defaultModule,
  });
  const close = vi.fn(async () => {});

  const server = {
    config: {
      root: input.root ?? "/repo",
    },
    ssrLoadModule,
    environments: {
      ssr: {
        moduleGraph: {
          getModuleByUrl,
        },
      },
    },
    close,
  } as unknown as Vite.ViteDevServer;

  return {
    server,
    close,
    ssrLoadModule,
    getModuleByUrl,
    lookedUpUrls,
    createSiteIndexModule(
      siteIndexes: SiteIndex.SiteIndex[] = [{ url: "/default" }],
    ): SiteIndex.ModuleExports {
      return { siteIndexes };
    },
    queueSsrLoadedModules(modules: SiteIndex.ModuleExports[]): void {
      ssrLoadModule.mockReset();

      for (const module of modules) {
        ssrLoadModule.mockResolvedValueOnce({ default: module });
      }
    },
    setModuleByUrl(url: string, node: Vite.EnvironmentModuleNode): void {
      moduleNodesByUrl.set(url, node);
    },
    setModulesByUrl(modules: Record<string, Vite.EnvironmentModuleNode>): void {
      for (const [url, node] of Object.entries(modules)) {
        moduleNodesByUrl.set(url, node);
      }
    },
  };
}
