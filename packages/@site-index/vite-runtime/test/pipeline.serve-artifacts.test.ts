import * as SiteIndex from "@site-index/core";
import type * as Vite from "vite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeViteSiteIndexPipelineService } from "../src/main.js";
import { createViteServerStub } from "./helpers/vite-server.stub.js";

vi.mock("@site-index/core", () => ({
  main: vi.fn(),
}));

function createModuleNode(
  file: string | null,
  importedModules: Vite.EnvironmentModuleNode[] = [],
): Vite.EnvironmentModuleNode {
  return {
    file,
    importedModules: new Set(importedModules),
  } as unknown as Vite.EnvironmentModuleNode;
}

function configureServeService(server: unknown): void {
  const service = makeViteSiteIndexPipelineService(
    { siteUrl: "https://example.com" },
    "@site-index/vite-plugin",
  );

  service.setViteConfig({ root: "/repo", mode: "development" } as never);
  service.configureServer(server as never);
}

describe("serve artifacts", () => {
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

    const { server } = createViteServerStub();

    configureServeService(server);

    await vi.waitFor(() => {
      expect(SiteIndex.main).toHaveBeenCalledTimes(1);
      expect(server.config.logger.warn).toHaveBeenCalledWith(
        "Duplicate URL: /about",
      );
    });
  });

  it("initial refresh populates artifact store and dependency set from loaded entry modules", async () => {
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
    const { server, setModuleByUrl, triggerWatcher } = createViteServerStub();
    const shared = createModuleNode("/repo/src/deps/shared.ts");
    setModuleByUrl(
      "./src/routes/blog.site-index.ts",
      createModuleNode("/repo/src/routes/blog.site-index.ts", [shared]),
    );

    configureServeService(server);

    expect(server.watcher.on).toHaveBeenCalledWith("add", expect.any(Function));
    expect(server.watcher.on).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
    expect(server.watcher.on).toHaveBeenCalledWith(
      "unlink",
      expect.any(Function),
    );

    await vi.waitFor(() => {
      expect(
        server.environments.ssr.moduleGraph.getModuleByUrl,
      ).toHaveBeenCalledTimes(1);
    });

    triggerWatcher("change", "/repo/src/deps/shared.ts");

    await vi.waitFor(() => {
      expect(SiteIndex.main).toHaveBeenCalledTimes(2);
    });
    await vi.waitFor(() => {
      expect(
        server.environments.ssr.moduleGraph.getModuleByUrl,
      ).toHaveBeenCalledTimes(1);
    });
  });

  it("runs exactly one startup load", async () => {
    vi.mocked(SiteIndex.main).mockResolvedValue({ data: [], warnings: [] });

    const { server, triggerWatcher } = createViteServerStub();

    configureServeService(server);

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

    const { server, triggerWatcher } = createViteServerStub();

    configureServeService(server);

    triggerWatcher("change", "/repo/src/routes/a.site-index.ts");
    triggerWatcher("unlink", "/repo/src/routes/b.site-index.ts");

    resolveFirstLoad?.({ data: [], warnings: [] });

    expect(SiteIndex.main).toHaveBeenCalledTimes(1);
  });

  it("keeps previous artifacts when refresh fails and logs error", async () => {
    vi.mocked(SiteIndex.main)
      .mockImplementationOnce(async (options) => {
        await options.loadModule({
          filePath: "/repo/src/routes/a.site-index.ts",
          importId: "./src/routes/a.site-index.ts",
        });

        return {
          data: [
            {
              filePath: "sitemap.xml",
              content: "STABLE_XML",
              contentType: "application/xml; charset=utf-8",
            },
          ],
          warnings: [],
        };
      })
      .mockRejectedValueOnce(new Error("refresh exploded"));

    const { server, setModuleByUrl, triggerWatcher } = createViteServerStub();
    setModuleByUrl(
      "./src/routes/a.site-index.ts",
      createModuleNode("/repo/src/routes/a.site-index.ts"),
    );

    configureServeService(server);

    await vi.waitFor(() => {
      expect(SiteIndex.main).toHaveBeenCalledTimes(1);
    });

    await vi.waitFor(() => {
      expect(
        server.environments.ssr.moduleGraph.getModuleByUrl,
      ).toHaveBeenCalledTimes(1);
    });

    triggerWatcher("change", "/repo/src/routes/a.site-index.ts");

    await vi.waitFor(() => {
      expect(SiteIndex.main).toHaveBeenCalledTimes(2);
    });
    await vi.waitFor(() => {
      expect(
        server.environments.ssr.moduleGraph.getModuleByUrl,
      ).toHaveBeenCalledTimes(1);
    });

    expect(server.config.logger.error).toHaveBeenCalledWith(
      "Failed to generate site-index artifacts: refresh exploded",
    );
  });

  it("refreshes on dependency changes discovered through the Vite graph", async () => {
    vi.mocked(SiteIndex.main).mockImplementation(async (options) => {
      await options.loadModule({
        filePath: "/repo/src/routes/entry.site-index.ts",
        importId: "./src/routes/entry.site-index.ts",
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

    const { server, setModuleByUrl, triggerWatcher } = createViteServerStub();
    const dep = createModuleNode("/repo/src/site-indexes/dep.ts");
    setModuleByUrl(
      "./src/routes/entry.site-index.ts",
      createModuleNode("/repo/src/routes/entry.site-index.ts", [dep]),
    );

    configureServeService(server);

    await vi.waitFor(() => {
      expect(SiteIndex.main).toHaveBeenCalledTimes(1);
    });

    await vi.waitFor(() => {
      expect(
        server.environments.ssr.moduleGraph.getModuleByUrl,
      ).toHaveBeenCalledTimes(1);
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

    const { server, close } = createViteServerStub();

    configureServeService(server);

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
