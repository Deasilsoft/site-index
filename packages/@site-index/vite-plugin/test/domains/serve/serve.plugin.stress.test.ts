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

describe("siteIndexServePlugin stress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("remains stable during rapid HMR bursts with failing and recovering builds", async () => {
    const watchedFile = "/repo/src/routes/a.site-index.ts";
    const failingBuildNumbers = new Set(
      Array.from({ length: 10 }, (_, index) => index + 2),
    );

    let artifacts = [
      {
        filePath: "robots.txt",
        content: "INITIAL",
        contentType: "text/plain; charset=utf-8",
      },
    ];

    let nextBuildNumber = 0;
    let buildQueue: Promise<void> = Promise.resolve();

    const runtime = createServeRuntimeMock({
      buildArtifacts: async () => {
        const buildNumber = ++nextBuildNumber;
        const run = buildQueue.then(async () => {
          await Promise.resolve();

          if (failingBuildNumbers.has(buildNumber)) {
            throw new Error(`hmr exploded ${buildNumber}`);
          }

          if (buildNumber >= 12) {
            artifacts = [
              {
                filePath: "robots.txt",
                content: `UPDATED-${buildNumber}`,
                contentType: "text/plain; charset=utf-8",
              },
            ];
          }

          return { data: artifacts, warnings: [] };
        });

        buildQueue = run.then(
          () => {},
          () => {},
        );

        return run;
      },
      getArtifacts: () => artifacts,
      getWatchedFiles: () => new Set([watchedFile]),
    });

    const { plugin, server } = await setupServePlugin({
      runtime,
      createRuntimeServiceMock,
    });

    const initialBuildResult = runtime.buildArtifacts.mock.results[0];

    if (!initialBuildResult) {
      throw new Error("Expected initial build to run during server setup");
    }

    const initialBuildPromise = initialBuildResult.value as Promise<unknown>;

    await initialBuildPromise;
    await Promise.resolve();

    const middleware = getRegisteredMiddleware(server);
    const next = vi.fn();

    const createResponse = () => ({
      setHeader: vi.fn(),
      statusCode: 0,
      end: vi.fn(),
    });

    const serveRobots = () => {
      const response = createResponse();

      middleware({ url: "/robots.txt", method: "GET" }, response, next);

      return response;
    };

    const triggerManyHotUpdates = async (count: number) => {
      await Promise.all(
        Array.from({ length: count }, () =>
          triggerHotUpdate({ plugin, server, file: watchedFile }),
        ),
      );
    };

    expect(serveRobots().end).toHaveBeenLastCalledWith("INITIAL");

    // failures
    await triggerManyHotUpdates(10);
    expect(server.config.logger.error).toHaveBeenCalledTimes(10);
    expect(serveRobots().end).toHaveBeenLastCalledWith("INITIAL");

    // recovery
    await triggerManyHotUpdates(10);
    expect(serveRobots().end).toHaveBeenLastCalledWith("UPDATED-21");

    expect(runtime.buildArtifacts).toHaveBeenCalledTimes(21);
  });
});

