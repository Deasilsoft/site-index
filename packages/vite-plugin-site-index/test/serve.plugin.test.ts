import type { ResolvedConfig, ViteDevServer } from "vite";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { serveArtifacts } from "../src/domains/serve/serve.artifacts.js";
import { siteIndexServePlugin } from "../src/index.js";
import { getPluginHookHandler } from "./helpers/plugin-hooks.js";

vi.mock("../src/domains/serve/serve.artifacts.js", () => ({
  serveArtifacts: vi.fn(),
}));

describe("siteIndexServePlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates serve setup after Vite config is resolved", () => {
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
    } as unknown as ViteDevServer;

    const configureServer = getPluginHookHandler<
      (server: ViteDevServer) => void | (() => void)
    >(plugin.configureServer);

    configureServer(server);

    expect(vi.mocked(serveArtifacts)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(serveArtifacts)).toHaveBeenCalledWith(
      server,
      { siteUrl: "https://example.com" },
      resolvedConfig,
    );
  });

  it("throws if configureServer is called before configResolved", () => {
    const plugin = siteIndexServePlugin({ siteUrl: "https://example.com" });

    const configureServer = getPluginHookHandler<
      (server: ViteDevServer) => void | (() => void)
    >(plugin.configureServer);

    expect(() => configureServer({} as ViteDevServer)).toThrow(
      "Vite config could not be resolved",
    );
  });
});
