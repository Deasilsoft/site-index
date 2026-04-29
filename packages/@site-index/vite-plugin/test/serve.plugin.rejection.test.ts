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

  it("logs and preserves current artifacts when hot-update rebuild fails", async () => {
    const runtime = {
      setViteConfig: vi.fn(),
      attachViteServer: vi.fn(),
      buildArtifacts: vi
        .fn()
        .mockResolvedValueOnce({ data: [], warnings: [] })
        .mockRejectedValueOnce(new Error("hmr exploded")),
      getArtifacts: vi.fn(() => [
        {
          filePath: "robots.txt",
          content: "FIRST",
          contentType: "text/plain; charset=utf-8",
        },
      ]),
      getWatchedFiles: vi.fn(
        () => new Set(["/repo/src/routes/a.site-index.ts"]),
      ),
      close: vi.fn(async () => {}),
    };

    const { builder } = createRuntimeBuilderMock(runtime);
    createRuntimeServiceMock.mockReturnValue(builder as never);

    const plugin = siteIndexServePlugin({ siteUrl: "https://example.com" });
    const server = createViteDevServerMock();

    const configureServer = getPluginHookHandler<
      (current: ViteDevServer) => void | (() => void)
    >(plugin.configureServer);
    configureServer(server);
    await Promise.resolve();

    const use = server.middlewares.use as unknown as ReturnType<typeof vi.fn>;
    const middleware = use.mock.calls[0]?.[0] as (
      req: { url?: string; method?: string },
      res: {
        setHeader(name: string, value: string): void;
        statusCode: number;
        end(body?: string): void;
      },
      next: () => void,
    ) => void;

    const res = {
      setHeader: vi.fn(),
      statusCode: 0,
      end: vi.fn(),
    };
    const next = vi.fn();

    middleware({ url: "/robots.txt", method: "GET" }, res, next);
    expect(res.end).toHaveBeenLastCalledWith("FIRST");

    const handleHotUpdate = getPluginHookHandler<
      (ctx: { file: string; server: ViteDevServer }) => Promise<void>
    >(plugin.handleHotUpdate);

    await expect(
      handleHotUpdate({
        file: "/repo/src/routes/a.site-index.ts",
        server,
      }),
    ).resolves.toBeUndefined();

    middleware({ url: "/robots.txt", method: "GET" }, res, next);
    expect(res.end).toHaveBeenLastCalledWith("FIRST");
    expect(server.config.logger.error).toHaveBeenCalledWith("hmr exploded");
  });
});
