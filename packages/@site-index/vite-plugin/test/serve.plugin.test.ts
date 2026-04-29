import type { ResolvedConfig, ViteDevServer } from "vite";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { siteIndexServePlugin } from "../src/index.js";
import { getPluginHookHandler } from "./helpers/plugin-hooks.js";
import { createRuntimeBuilderMock } from "./helpers/runtime.builder.mock.js";
import { createViteDevServerMock } from "./helpers/vite-dev-server.mock.js";

const createRuntimeServiceMock = vi.hoisted(() => vi.fn());

vi.mock("@site-index/vite-runtime", () => ({
  createRuntimeService: createRuntimeServiceMock,
}));

describe("siteIndexServePlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wires runtime to serve lifecycle and middleware", async () => {
    const runtime = {
      setViteConfig: vi.fn(),
      attachViteServer: vi.fn(),
      buildArtifacts: vi.fn(async () => ({
        data: [],
        warnings: [{ message: "Duplicate URL: /a" }],
      })),
      getArtifacts: vi.fn(() => [
        {
          filePath: "/robots.txt",
          content: "ROBOTS",
          contentType: "text/plain; charset=utf-8",
        },
      ]),
      getWatchedFiles: vi.fn(
        () => new Set(["/repo/src/routes/a.site-index.ts"]),
      ),
      close: vi.fn(async () => {}),
    };

    const { builder, withOptions } = createRuntimeBuilderMock(runtime);

    createRuntimeServiceMock.mockReturnValue(builder as never);

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

    const server = createViteDevServerMock();

    const configureServer = getPluginHookHandler<
      (server: ViteDevServer) => void | (() => void)
    >(plugin.configureServer);

    configureServer(server);
    await Promise.resolve();

    const handleHotUpdate = getPluginHookHandler<
      (ctx: { file: string; server: ViteDevServer }) => Promise<void> | void
    >(plugin.handleHotUpdate);

    await handleHotUpdate({
      file: "/repo/src/routes/a.site-index.ts",
      server,
    });

    const closeBundle = getPluginHookHandler<() => Promise<void> | void>(
      plugin.closeBundle,
    );

    await closeBundle();

    expect(createRuntimeServiceMock).toHaveBeenCalledTimes(1);
    expect(withOptions).toHaveBeenCalledWith({
      siteUrl: "https://example.com",
    });
    expect(runtime.setViteConfig).toHaveBeenCalledWith(resolvedConfig);
    expect(runtime.attachViteServer).toHaveBeenCalledWith(server);
    expect(server.middlewares.use).toHaveBeenCalledTimes(1);
    expect(runtime.buildArtifacts).toHaveBeenCalledTimes(2);
    expect(server.config.logger.warn).toHaveBeenCalledWith("Duplicate URL: /a");
    expect(runtime.close).toHaveBeenCalledTimes(1);
  });

  it("skips rebuild for hot updates outside watched files", async () => {
    const runtime = {
      setViteConfig: vi.fn(),
      attachViteServer: vi.fn(),
      buildArtifacts: vi.fn(async () => ({ data: [], warnings: [] })),
      getArtifacts: vi.fn(() => []),
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
      (server: ViteDevServer) => void | (() => void)
    >(plugin.configureServer);
    configureServer(server);
    await Promise.resolve();

    const handleHotUpdate = getPluginHookHandler<
      (ctx: { file: string; server: ViteDevServer }) => Promise<void> | void
    >(plugin.handleHotUpdate);

    await handleHotUpdate({
      file: "/repo/src/routes/not-watched.ts",
      server,
    });

    expect(runtime.buildArtifacts).toHaveBeenCalledTimes(1);
    expect(server.config.logger.warn).not.toHaveBeenCalled();
  });

  it("keeps middleware map stable and syncs artifacts after initial and hot builds", async () => {
    const firstArtifacts = [
      {
        filePath: "robots.txt",
        content: "FIRST",
        contentType: "text/plain; charset=utf-8",
      },
    ];
    const secondArtifacts = [
      {
        filePath: "robots.txt",
        content: "SECOND",
        contentType: "text/plain; charset=utf-8",
      },
    ];

    let currentArtifacts = firstArtifacts;

    const runtime = {
      setViteConfig: vi.fn(),
      attachViteServer: vi.fn(),
      buildArtifacts: vi.fn(async () => {
        currentArtifacts =
          runtime.buildArtifacts.mock.calls.length === 1
            ? firstArtifacts
            : secondArtifacts;

        return { data: currentArtifacts, warnings: [] };
      }),
      getArtifacts: vi.fn(() => currentArtifacts),
      getWatchedFiles: vi.fn(
        () => new Set(["/repo/src/routes/a.site-index.ts"]),
      ),
      close: vi.fn(async () => {}),
    };

    const { builder } = createRuntimeBuilderMock(runtime);

    createRuntimeServiceMock.mockReturnValue(builder as never);

    const plugin = siteIndexServePlugin({ siteUrl: "https://example.com" });
    const use = vi.fn();
    const server = createViteDevServerMock();
    server.middlewares.use = use;

    const configureServer = getPluginHookHandler<
      (server: ViteDevServer) => void | (() => void)
    >(plugin.configureServer);

    configureServer(server);
    await Promise.resolve();

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
      (ctx: { file: string; server: ViteDevServer }) => Promise<void> | void
    >(plugin.handleHotUpdate);

    await handleHotUpdate({
      file: "/repo/src/routes/a.site-index.ts",
      server,
    });

    middleware({ url: "/robots.txt", method: "GET" }, res, next);
    expect(res.end).toHaveBeenLastCalledWith("SECOND");
    expect(server.middlewares.use).toHaveBeenCalledTimes(1);
  });
});
