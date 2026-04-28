import * as SiteIndex from "@site-index/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeViteSiteIndexService } from "../src/main.js";

vi.mock("@site-index/core", () => ({
  main: vi.fn(),
}));

describe("makeViteSiteIndexService events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("emits warning and refreshed events after runSiteIndex", async () => {
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
        warnings: [{ message: "Duplicate URL: /blog" }],
      };
    });

    const server = {
      ssrLoadModule: vi
        .fn()
        .mockResolvedValue({ default: { siteIndexes: [] } }),
    };

    const service = makeViteSiteIndexService({ server: server as never });
    const onWarning = vi.fn();
    const onRefreshed = vi.fn();

    service.onWarning(onWarning);
    service.onRefreshed(onRefreshed);

    await service.runSiteIndex({
      siteUrl: "https://example.com",
      rootPath: "/repo",
      extensions: undefined,
    });

    expect(vi.mocked(SiteIndex.main)).toHaveBeenCalledTimes(1);
    expect(server.ssrLoadModule).toHaveBeenCalledWith(
      "./src/routes/blog.site-index.ts",
    );
    expect(onWarning).toHaveBeenCalledWith({ message: "Duplicate URL: /blog" });
    expect(onRefreshed).toHaveBeenCalledWith({
      artifacts: [
        {
          filePath: "sitemap.xml",
          content: "INDEX_XML",
          contentType: "application/xml; charset=utf-8",
        },
      ],
      loadedModules: [
        {
          filePath: "/repo/src/routes/blog.site-index.ts",
          importId: "./src/routes/blog.site-index.ts",
          siteIndexes: [],
        },
      ],
    });
    expect(service.getLoadedModules()).toEqual([
      {
        filePath: "/repo/src/routes/blog.site-index.ts",
        importId: "./src/routes/blog.site-index.ts",
        siteIndexes: [],
      },
    ]);
  });

  it("emits failed events and rethrows runSiteIndex errors", async () => {
    const refreshError = new Error("refresh exploded");
    vi.mocked(SiteIndex.main).mockRejectedValue(refreshError);

    const server = {
      ssrLoadModule: vi.fn(),
    };

    const service = makeViteSiteIndexService({ server: server as never });
    const onFailed = vi.fn();
    service.onError(onFailed);

    await expect(
      service.runSiteIndex({
        siteUrl: "https://example.com",
        rootPath: "/repo",
        extensions: undefined,
      }),
    ).rejects.toBe(refreshError);

    expect(onFailed).toHaveBeenCalledWith(refreshError);
  });
});
