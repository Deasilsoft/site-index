import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createServeRuntimeMock,
  getRegisteredMiddleware,
  setupServePlugin,
  triggerHotUpdate,
} from "./helpers/serve.plugin.js";

const createRuntimeServiceMock = vi.hoisted(() => vi.fn());

vi.mock("@site-index/vite-runtime", () => ({
  createRuntimeService: createRuntimeServiceMock,
}));

describe("siteIndexServePlugin rejections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([new Error("Vite config could not be resolved"), "broken"])(
    "handles rejection: %p",
    async (input) => {
      const runtime = createServeRuntimeMock({
        buildArtifacts: async () => {
          throw input;
        },
      });

      const { server } = await setupServePlugin({
        runtime,
        createRuntimeServiceMock,
      });

      expect(server.config.logger.error).toHaveBeenCalledWith(
        `Error: ${input instanceof Error ? input.message : String(input)}`,
      );
    },
  );

  it("logs and preserves current artifacts when hot-update rebuild fails", async () => {
    const runtime = createServeRuntimeMock({
      buildArtifacts: vi
        .fn()
        .mockResolvedValueOnce({
          data: [
            {
              filePath: "robots.txt",
              content: "FIRST",
              contentType: "text/plain; charset=utf-8",
            },
          ],
          warnings: [],
        })
        .mockRejectedValueOnce(new Error("hmr exploded")),
      getArtifacts: () => [
        {
          filePath: "robots.txt",
          content: "FIRST",
          contentType: "text/plain; charset=utf-8",
        },
      ],
      getWatchedFiles: () => new Set(["/repo/src/routes/a.site-index.ts"]),
    });

    const { plugin, server } = await setupServePlugin({
      runtime,
      createRuntimeServiceMock,
    });

    const middleware = getRegisteredMiddleware(server);

    const res = {
      setHeader: vi.fn(),
      statusCode: 0,
      end: vi.fn(),
    };
    const next = vi.fn();

    middleware({ url: "/robots.txt", method: "GET" }, res, next);
    expect(res.end).toHaveBeenLastCalledWith("FIRST");

    await expect(
      triggerHotUpdate({
        plugin,
        file: "/repo/src/routes/a.site-index.ts",
        server,
      }),
    ).resolves.toBeUndefined();

    middleware({ url: "/robots.txt", method: "GET" }, res, next);
    expect(res.end).toHaveBeenLastCalledWith("FIRST");
    expect(server.config.logger.error).toHaveBeenCalledWith(
      "Error: hmr exploded",
    );
  });
});
