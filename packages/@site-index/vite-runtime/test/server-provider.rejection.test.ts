import * as SiteIndex from "@site-index/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRuntimeService } from "../src/index.js";

const hoisted = vi.hoisted(() => {
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
    close: vi.fn(async () => {}),
  }));

  return {
    createServer,
  };
});

vi.mock("vite", () => ({
  createServer: hoisted.createServer,
}));

vi.mock("@site-index/core", () => ({
  main: vi.fn(),
}));

describe("RuntimeService Vite server rejection paths", () => {
  beforeEach(() => {
    hoisted.createServer.mockClear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws when updating config after an owned server is active", async () => {
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

    expect(() =>
      runtime.setViteConfig({
        root: "/other",
        mode: "test",
        configFile: false,
      } as never),
    ).toThrow("Cannot set config if server is active");
  });

  it("throws when attaching a second server while one is active", async () => {
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

    expect(() => runtime.attachViteServer({} as never)).toThrow(
      "Cannot attach server if another server is active",
    );
  });

  it("throws when no Vite config or attached server is available", async () => {
    const runtime = createRuntimeService()
      .withOptions({ siteUrl: "https://example.com" })
      .build();

    await expect(runtime.buildArtifacts()).rejects.toThrow(
      "Vite config could not be resolved",
    );
  });
});
