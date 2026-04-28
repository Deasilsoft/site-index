import type { ResolvedConfig, ViteDevServer } from "vite";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { siteIndexServePlugin } from "../src/index.js";
import { getPluginHookHandler } from "./helpers/plugin-hooks.js";

const makeViteSiteIndexPipelineServiceMock = vi.hoisted(() => vi.fn());

vi.mock("@site-index/vite-runtime", () => ({
  makeViteSiteIndexPipelineService: makeViteSiteIndexPipelineServiceMock,
}));

describe("siteIndexServePlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates hooks to ServeService", () => {
    const service = {
      setViteConfig: vi.fn(),
      configureServer: vi.fn(),
      getServeArtifacts: vi.fn(() => new Map()),
    };

    makeViteSiteIndexPipelineServiceMock.mockReturnValue(service as never);

    const plugin = siteIndexServePlugin({ siteUrl: "https://example.com" });
    const resolvedConfig = {
      command: "serve",
      root: "/repo",
      mode: "development",
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    } as unknown as ResolvedConfig;

    const configResolved = getPluginHookHandler<
      (resolved: ResolvedConfig) => void | Promise<void>
    >(plugin.configResolved);

    configResolved(resolvedConfig);

    const server = {
      config: {
        logger: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
        },
      },
      middlewares: {
        use: vi.fn(),
      },
    } as unknown as ViteDevServer;

    const configureServer = getPluginHookHandler<
      (server: ViteDevServer) => void | (() => void)
    >(plugin.configureServer);

    configureServer(server);

    expect(makeViteSiteIndexPipelineServiceMock).toHaveBeenCalledWith(
      { siteUrl: "https://example.com" },
      "@site-index/vite-plugin",
    );
    expect(service.setViteConfig).toHaveBeenCalledWith(resolvedConfig);
    expect(service.configureServer).toHaveBeenCalledWith(server);
  });

  it("surfaces service errors from configureServer", () => {
    const service = {
      setViteConfig: vi.fn(),
      configureServer: vi.fn(() => {
        throw new Error("Vite config could not be resolved");
      }),
      getServeArtifacts: vi.fn(() => new Map()),
    };

    makeViteSiteIndexPipelineServiceMock.mockReturnValue(service as never);

    const plugin = siteIndexServePlugin({ siteUrl: "https://example.com" });

    const configureServer = getPluginHookHandler<
      (server: ViteDevServer) => void | (() => void)
    >(plugin.configureServer);

    expect(() => configureServer({} as ViteDevServer)).toThrow(
      "Vite config could not be resolved",
    );
    expect(service.configureServer).toHaveBeenCalledTimes(1);
  });
});
