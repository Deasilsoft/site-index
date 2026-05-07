import * as SiteIndex from "@site-index/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRuntimeService } from "../src/index.js";

const hoisted = vi.hoisted(() => {
  const close = vi.fn(async () => {});
  const ssrLoadModule = vi.fn(async () => ({ default: { siteIndexes: [] } }));
  const moduleNode = {
    file: "/project/src/routes/a.site-index.ts",
    importedModules: new Set(),
  };

  const createServer = vi.fn(async () => ({
    config: { root: "/project" },
    environments: {
      ssr: {
        moduleGraph: {
          getModuleByUrl: vi.fn(async () => moduleNode),
        },
      },
    },
    ssrLoadModule,
    close,
  }));

  return {
    close,
    ssrLoadModule,
    createServer,
  };
});

vi.mock("vite", () => ({
  createServer: hoisted.createServer,
}));

vi.mock("@site-index/core", () => ({
  main: vi.fn(),
}));

describe("RuntimeService Vite server lifecycle", () => {
  beforeEach(() => {
    hoisted.close.mockReset();
    hoisted.ssrLoadModule.mockReset();
    hoisted.createServer.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a deterministic Vite server config for owned servers", async () => {
    vi.mocked(SiteIndex.main).mockImplementation(async (options) => {
      await options.loadModule({
        filePath: "/project/src/routes/a.site-index.ts",
        importId: "./src/routes/a.site-index.ts",
      });

      return { data: [], warnings: [] };
    });

    const runtime = createRuntimeService()
      .withOptions({ siteUrl: "https://example.com" })
      .withViteConfig({
        root: "/project",
        mode: "test",
        configFile: false,
      } as never)
      .build();

    await runtime.buildArtifacts();

    expect(hoisted.createServer).toHaveBeenCalledWith({
      root: "/project",
      mode: "test",
      appType: "custom",
      server: {
        middlewareMode: true,
        hmr: false,
      },
      configFile: false,
    });

    await runtime.close();
    expect(hoisted.close).toHaveBeenCalledOnce();
  });

  it("creates owned server config without configFile when not provided", async () => {
    vi.mocked(SiteIndex.main).mockImplementation(async (options) => {
      await options.loadModule({
        filePath: "/project/src/routes/a.site-index.ts",
        importId: "./src/routes/a.site-index.ts",
      });

      return { data: [], warnings: [] };
    });

    const runtime = createRuntimeService()
      .withOptions({ siteUrl: "https://example.com" })
      .withViteConfig({
        root: "/project",
        mode: "test",
      } as never)
      .build();

    await runtime.buildArtifacts();

    expect(hoisted.createServer).toHaveBeenCalledWith({
      root: "/project",
      mode: "test",
      appType: "custom",
      server: {
        middlewareMode: true,
        hmr: false,
      },
    });

    await runtime.close();
  });

  it("does not close externally provided servers", async () => {
    vi.mocked(SiteIndex.main).mockResolvedValue({ data: [], warnings: [] });

    const externalClose = vi.fn(async () => {});
    const externalServer = {
      config: { root: "/repo" },
      environments: {
        ssr: {
          moduleGraph: {
            getModuleByUrl: vi.fn(async () => {}),
          },
        },
      },
      ssrLoadModule: vi.fn(async () => ({ default: { siteIndexes: [] } })),
      close: externalClose,
    };

    const runtime = createRuntimeService()
      .withOptions({ siteUrl: "https://example.com" })
      .withViteServer(externalServer as never)
      .build();

    await runtime.buildArtifacts();
    await runtime.close();

    expect(externalClose).not.toHaveBeenCalled();
    expect(hoisted.createServer).not.toHaveBeenCalled();
  });
});
