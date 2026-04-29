import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createServeRuntimeMock,
  getRegisteredMiddleware,
  setupServePlugin,
  triggerCloseBundle,
  triggerHotUpdate,
} from "./helpers/serve.plugin.js";

const createRuntimeServiceMock = vi.hoisted(() => vi.fn());

vi.mock("@site-index/vite-runtime", () => ({
  createRuntimeService: createRuntimeServiceMock,
}));

describe("siteIndexServePlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("wires runtime to serve lifecycle and middleware", async () => {
    const runtime = createServeRuntimeMock({
      buildArtifacts: async () => ({
        data: [],
        warnings: [{ message: "Duplicate URL: /a" }],
      }),
      getArtifacts: () => [
        {
          filePath: "/robots.txt",
          content: "ROBOTS",
          contentType: "text/plain; charset=utf-8",
        },
      ],
      getWatchedFiles: () => new Set(["/repo/src/routes/a.site-index.ts"]),
    });

    const { plugin, server, resolvedConfig, withOptions } = setupServePlugin({
      runtime,
      createRuntimeServiceMock,
    });
    await Promise.resolve();

    await triggerHotUpdate({
      plugin,
      file: "/repo/src/routes/a.site-index.ts",
      server,
    });
    await triggerCloseBundle(plugin);

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
    const runtime = createServeRuntimeMock({
      getWatchedFiles: () => new Set(["/repo/src/routes/a.site-index.ts"]),
    });

    const { plugin, server } = setupServePlugin({
      runtime,
      createRuntimeServiceMock,
    });
    await Promise.resolve();

    await triggerHotUpdate({
      plugin,
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

    const runtime = createServeRuntimeMock({
      buildArtifacts: async () => {
        currentArtifacts =
          runtime.buildArtifacts.mock.calls.length === 1
            ? firstArtifacts
            : secondArtifacts;
        return { data: currentArtifacts, warnings: [] };
      },
      getArtifacts: () => currentArtifacts,
      getWatchedFiles: () => new Set(["/repo/src/routes/a.site-index.ts"]),
    });

    const { plugin, server } = setupServePlugin({
      runtime,
      createRuntimeServiceMock,
    });
    await Promise.resolve();

    const use = server.middlewares.use as unknown as ReturnType<typeof vi.fn>;
    const middleware = getRegisteredMiddleware(server);

    const res = { setHeader: vi.fn(), statusCode: 0, end: vi.fn() };
    const next = vi.fn();

    middleware({ url: "/robots.txt", method: "GET" }, res, next);
    expect(res.end).toHaveBeenLastCalledWith("FIRST");

    await triggerHotUpdate({
      plugin,
      file: "/repo/src/routes/a.site-index.ts",
      server,
    });

    middleware({ url: "/robots.txt", method: "GET" }, res, next);
    expect(res.end).toHaveBeenLastCalledWith("SECOND");
    expect(use).toHaveBeenCalledTimes(1);
  });
});
