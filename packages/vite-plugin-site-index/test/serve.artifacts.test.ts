import * as SiteIndex from "site-index";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { collectRelevantFiles } from "../src/shared/vite-dependency-graph.js";
import { serveArtifacts } from "../src/domains/serve/serve.artifacts.js";
import { createResponseStub } from "./helpers/http.stub.js";
import { createViteServerStub } from "./helpers/vite-server.stub.js";

vi.mock("site-index", () => ({
  main: vi.fn(),
}));

vi.mock("../src/shared/vite-dependency-graph.js", () => ({
  collectRelevantFiles: vi.fn(),
}));

describe("serveArtifacts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("forwards runtime warnings to server logger", async () => {
    vi.mocked(SiteIndex.main).mockResolvedValue({
      data: [],
      warnings: [{ message: "Duplicate URL: /about" }],
    });
    vi.mocked(collectRelevantFiles).mockResolvedValue(new Set());

    const { server } = createViteServerStub();

    serveArtifacts(server as never, { siteUrl: "https://example.com" }, {
      root: "/repo",
      mode: "development",
    } as never);

    await vi.waitFor(() => {
      expect(SiteIndex.main).toHaveBeenCalledTimes(1);
      expect(server.config.logger.warn).toHaveBeenCalledWith(
        "Duplicate URL: /about",
      );
    });
  });

  it("initial refresh populates artifact store and dependency set from tracked entry modules", async () => {
    vi.mocked(SiteIndex.main).mockImplementation(async (options) => {
      await options.loadModule({
        filePath: "/repo/src/routes/blog.site-index.ts",
        importId: "./src/routes/blog.site-index.ts",
      });

      return {
        data: [
          {
            filePath: "sitemap.xml",
            content: "INDEX_XML",
            contentType: "application/xml; charset=utf-8",
          },
        ],
        warnings: [],
      };
    });
    vi.mocked(collectRelevantFiles).mockImplementation(
      async (_server, importIds) => {
        expect([...importIds]).toEqual(["./src/routes/blog.site-index.ts"]);

        return new Set(["/repo/src/deps/shared.ts"]);
      },
    );

    const { server, getMiddleware, triggerWatcher } = createViteServerStub();

    serveArtifacts(server as never, { siteUrl: "https://example.com" }, {
      root: "/repo",
      mode: "development",
    } as never);

    expect(server.watcher.on).toHaveBeenCalledWith("add", expect.any(Function));
    expect(server.watcher.on).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
    expect(server.watcher.on).toHaveBeenCalledWith(
      "unlink",
      expect.any(Function),
    );
    expect(server.middlewares.use).toHaveBeenCalledTimes(1);

    await vi.waitFor(() => {
      expect(collectRelevantFiles).toHaveBeenCalledTimes(1);
    });

    const middleware = getMiddleware();

    await vi.waitFor(() => {
      const res = createResponseStub();
      const next = vi.fn();

      middleware?.({ url: "/sitemap.xml", method: "GET" }, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.end).toHaveBeenCalledWith("INDEX_XML");
    });

    triggerWatcher("change", "/repo/src/deps/shared.ts");

    await vi.waitFor(() => {
      expect(SiteIndex.main).toHaveBeenCalledTimes(2);
    });
  });

  it("runs exactly one startup load", async () => {
    vi.mocked(SiteIndex.main).mockResolvedValue({ data: [], warnings: [] });
    vi.mocked(collectRelevantFiles).mockResolvedValue(
      new Set(["/repo/src/routes/a.site-index.ts"]),
    );

    const { server, triggerWatcher } = createViteServerStub();

    serveArtifacts(server as never, { siteUrl: "https://example.com" }, {
      root: "/repo",
      mode: "development",
    } as never);

    await vi.waitFor(() => {
      expect(SiteIndex.main).toHaveBeenCalledTimes(1);
    });

    triggerWatcher("change", "/repo/src/main.ts");
    triggerWatcher("add", "/repo/public/favicon.ico");

    await vi.advanceTimersByTimeAsync(50);

    expect(SiteIndex.main).toHaveBeenCalledTimes(1);
  });

  it("does not trigger extra startup loads when watcher events fire before dependencies are known", async () => {
    let resolveFirstLoad:
      | ((value: Awaited<ReturnType<typeof SiteIndex.main>>) => void)
      | undefined;
    const firstLoad = new Promise<Awaited<ReturnType<typeof SiteIndex.main>>>(
      (resolve) => {
        resolveFirstLoad = resolve;
      },
    );

    vi.mocked(SiteIndex.main).mockReturnValue(firstLoad);
    vi.mocked(collectRelevantFiles).mockResolvedValue(new Set());

    const { server, triggerWatcher } = createViteServerStub();

    serveArtifacts(server as never, { siteUrl: "https://example.com" }, {
      root: "/repo",
      mode: "development",
    } as never);

    triggerWatcher("change", "/repo/src/routes/a.site-index.ts");
    triggerWatcher("unlink", "/repo/src/routes/b.site-index.ts");

    resolveFirstLoad?.({ data: [], warnings: [] });

    await vi.waitFor(() => {
      expect(collectRelevantFiles).toHaveBeenCalledTimes(1);
    });

    expect(SiteIndex.main).toHaveBeenCalledTimes(1);
  });

  it("keeps previous artifacts when refresh fails and logs error", async () => {
    vi.mocked(SiteIndex.main)
      .mockResolvedValueOnce({
        data: [
          {
            filePath: "sitemap.xml",
            content: "STABLE_XML",
            contentType: "application/xml; charset=utf-8",
          },
        ],
        warnings: [],
      })
      .mockRejectedValueOnce(new Error("refresh exploded"));
    vi.mocked(collectRelevantFiles).mockResolvedValue(
      new Set(["/repo/src/routes/a.site-index.ts"]),
    );

    const { server, getMiddleware, triggerWatcher } = createViteServerStub();

    serveArtifacts(server as never, { siteUrl: "https://example.com" }, {
      root: "/repo",
      mode: "development",
    } as never);

    await vi.waitFor(() => {
      expect(SiteIndex.main).toHaveBeenCalledTimes(1);
    });
    await vi.waitFor(() => {
      expect(collectRelevantFiles).toHaveBeenCalledTimes(1);
    });

    triggerWatcher("change", "/repo/src/routes/a.site-index.ts");

    await vi.waitFor(() => {
      expect(SiteIndex.main).toHaveBeenCalledTimes(2);
    });

    expect(server.config.logger.error).toHaveBeenCalledWith(
      "Failed to generate site-index artifacts: refresh exploded",
    );

    const middleware = getMiddleware();
    const res = createResponseStub();
    const next = vi.fn();

    middleware?.({ url: "/sitemap.xml", method: "GET" }, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.end).toHaveBeenCalledWith("STABLE_XML");
  });

  it("refreshes on dependency changes discovered through the Vite graph", async () => {
    vi.mocked(SiteIndex.main).mockResolvedValue({ data: [], warnings: [] });
    vi.mocked(collectRelevantFiles).mockResolvedValue(
      new Set(["/repo/src/site-indexes/dep.ts"]),
    );

    const { triggerWatcher, server } = createViteServerStub();

    serveArtifacts(server as never, { siteUrl: "https://example.com" }, {
      root: "/repo",
      mode: "development",
    } as never);

    await vi.waitFor(() => {
      expect(SiteIndex.main).toHaveBeenCalledTimes(1);
    });
    await vi.waitFor(() => {
      expect(collectRelevantFiles).toHaveBeenCalledTimes(1);
    });

    triggerWatcher("change", "/repo/src/site-indexes/dep.ts");

    await vi.waitFor(() => {
      expect(SiteIndex.main).toHaveBeenCalledTimes(2);
    });

    await vi.advanceTimersByTimeAsync(50);

    expect(SiteIndex.main).toHaveBeenCalledTimes(2);
  });

  it("cleans up watcher listeners on close", async () => {
    vi.mocked(SiteIndex.main).mockResolvedValue({ data: [], warnings: [] });
    vi.mocked(collectRelevantFiles).mockResolvedValue(new Set());

    const { server, close } = createViteServerStub();

    serveArtifacts(server as never, { siteUrl: "https://example.com" }, {
      root: "/repo",
      mode: "development",
    } as never);

    await vi.waitFor(() => {
      expect(SiteIndex.main).toHaveBeenCalledTimes(1);
    });

    close();

    expect(server.watcher.off).toHaveBeenCalledWith(
      "add",
      expect.any(Function),
    );
    expect(server.watcher.off).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
    expect(server.watcher.off).toHaveBeenCalledWith(
      "unlink",
      expect.any(Function),
    );
  });
});
