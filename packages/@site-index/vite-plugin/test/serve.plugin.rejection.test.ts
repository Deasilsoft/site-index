import type { ViteDevServer } from "vite";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { siteIndexServePlugin } from "../src/index.js";
import { getPluginHookHandler } from "./helpers/plugin-hooks.js";
import { createRuntimeBuilderMock } from "./helpers/runtime.builder.mock.js";
import { createViteDevServerMock } from "./helpers/vite-dev-server.mock.js";

const createRuntimeServiceMock = vi.hoisted(() => vi.fn());

vi.mock("@site-index/vite-runtime", () => ({
  createRuntimeService: createRuntimeServiceMock,
}));

describe("siteIndexServePlugin rejections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs build errors from configureServer", async () => {
    const runtime = {
      setViteConfig: vi.fn(),
      attachViteServer: vi.fn(),
      buildArtifacts: vi.fn(async () => {
        throw new Error("Vite config could not be resolved");
      }),
      getArtifacts: vi.fn(() => []),
      getWatchedFiles: vi.fn(() => new Set()),
      close: vi.fn(async () => {}),
    };

    const { builder } = createRuntimeBuilderMock(runtime);
    createRuntimeServiceMock.mockReturnValue(builder as never);

    const plugin = siteIndexServePlugin({ siteUrl: "https://example.com" });
    const server = createViteDevServerMock();

    const configureServer = getPluginHookHandler<
      (server: ViteDevServer) => void | (() => void)
    >(plugin.configureServer);

    configureServer(server);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(server.config.logger.error).toHaveBeenCalledWith(
      "Vite config could not be resolved",
    );
  });

  it("logs non-Error rejections from configureServer", async () => {
    const runtime = {
      setViteConfig: vi.fn(),
      attachViteServer: vi.fn(),
      buildArtifacts: vi.fn(async () => {
        throw "broken";
      }),
      getArtifacts: vi.fn(() => []),
      getWatchedFiles: vi.fn(() => new Set()),
      close: vi.fn(async () => {}),
    };

    const { builder } = createRuntimeBuilderMock(runtime);
    createRuntimeServiceMock.mockReturnValue(builder as never);

    const plugin = siteIndexServePlugin({ siteUrl: "https://example.com" });
    const server = createViteDevServerMock();

    const configureServer = getPluginHookHandler<
      (server: ViteDevServer) => void | (() => void)
    >(plugin.configureServer);

    configureServer(server);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(server.config.logger.error).toHaveBeenCalledWith("broken");
  });
});
