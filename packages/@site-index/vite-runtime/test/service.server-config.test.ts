import * as SiteIndex from "@site-index/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeViteSiteIndexService } from "../src/main.js";

const hoisted = vi.hoisted(() => {
  const close = vi.fn(async () => {});
  const ssrLoadModule = vi.fn();
  const createServer = vi.fn(async () => ({
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

describe("makeViteSiteIndexService server config", () => {
  beforeEach(() => {
    hoisted.close.mockReset();
    hoisted.ssrLoadModule.mockReset();
    hoisted.createServer.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a deterministic Vite server config and forwards module loading", async () => {
    hoisted.ssrLoadModule.mockResolvedValue({
      default: { siteIndexes: [{ url: "/" }] },
    });

    vi.mocked(SiteIndex.main).mockImplementation(async (options) => {
      const loaded = await options.loadModule({
        filePath: "a",
        importId: "virtual:site-index",
      });

      expect(loaded).toEqual({ siteIndexes: [{ url: "/" }] });

      return {
        data: [],
        warnings: [],
      };
    });

    const service = makeViteSiteIndexService({
      viteConfig: {
        root: "/project",
        mode: "test",
        configFile: false,
      } as never,
    });

    const result = await service.runSiteIndex({
      siteUrl: "https://example.com",
      rootPath: "/project",
      extensions: undefined,
    });

    expect(result.artifacts).toEqual([]);
    expect(result.loadedModules).toEqual([
      {
        filePath: "a",
        importId: "virtual:site-index",
        siteIndexes: [{ url: "/" }],
      },
    ]);
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
    expect(hoisted.ssrLoadModule).toHaveBeenCalledWith("virtual:site-index");

    await service.close();
    expect(hoisted.close).toHaveBeenCalledOnce();
  });

  it("passes configFile through and keeps cleanup available after pipeline errors", async () => {
    hoisted.ssrLoadModule.mockResolvedValue({
      default: { siteIndexes: [] },
    });

    vi.mocked(SiteIndex.main).mockImplementation(async (options) => {
      await options.loadModule({
        filePath: "a",
        importId: "virtual:site-index",
      });

      throw new Error("pipeline failed");
    });

    const service = makeViteSiteIndexService({
      viteConfig: {
        root: "/project",
        mode: "test",
        configFile: "/project/vite.config.ts",
      } as never,
    });

    await expect(
      service.runSiteIndex({
        siteUrl: "https://example.com",
        rootPath: "/project",
        extensions: undefined,
      }),
    ).rejects.toThrow("pipeline failed");

    expect(hoisted.createServer).toHaveBeenCalledWith({
      root: "/project",
      mode: "test",
      appType: "custom",
      server: {
        middlewareMode: true,
        hmr: false,
      },
      configFile: "/project/vite.config.ts",
    });

    await service.close();
    expect(hoisted.close).toHaveBeenCalledOnce();
  });
});
