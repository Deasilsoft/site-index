import * as SiteIndex from "site-index";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeServeRefresh } from "../src/domains/serve/serve.refresh.js";
import { collectRelevantFiles } from "../src/shared/vite-dependency-graph.js";

vi.mock("site-index", () => ({
  main: vi.fn(),
}));

vi.mock("../src/shared/vite-dependency-graph.js", () => ({
  collectRelevantFiles: vi.fn(),
}));

describe("makeServeRefresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("collects dependencies from tracked import ids and emits successful refresh state", async () => {
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

    vi.mocked(collectRelevantFiles).mockResolvedValue(
      new Set(["/repo/src/content/blog.ts"]),
    );

    const server = {
      config: {
        logger: {
          warn: vi.fn(),
          error: vi.fn(),
        },
      },
      ssrLoadModule: vi.fn().mockResolvedValue({ default: { siteIndexes: [] } }),
    };

    const onSuccessfulRefresh = vi.fn();
    const refresh = makeServeRefresh(
      server as never,
      { siteUrl: "https://example.com" },
      { root: "/repo", mode: "development" } as never,
      onSuccessfulRefresh,
    );

    await refresh.requestRefresh();

    expect(vi.mocked(SiteIndex.main)).toHaveBeenCalledTimes(1);
    expect(server.ssrLoadModule).toHaveBeenCalledWith(
      "./src/routes/blog.site-index.ts",
    );
    expect(collectRelevantFiles).toHaveBeenCalledWith(server, new Set([
      "./src/routes/blog.site-index.ts",
    ]));
    expect(server.config.logger.warn).toHaveBeenCalledWith("Duplicate URL: /blog");
    expect(onSuccessfulRefresh).toHaveBeenCalledWith({
      artifacts: [
        {
          filePath: "sitemap.xml",
          content: "INDEX_XML",
          contentType: "application/xml; charset=utf-8",
        },
      ],
      nextRelevantFiles: new Set(["/repo/src/content/blog.ts"]),
    });
  });

  it("logs failures and keeps previous caller state by skipping success callback", async () => {
    vi.mocked(SiteIndex.main).mockRejectedValue(new Error("refresh exploded"));
    vi.mocked(collectRelevantFiles).mockResolvedValue(new Set());

    const server = {
      config: {
        logger: {
          warn: vi.fn(),
          error: vi.fn(),
        },
      },
      ssrLoadModule: vi.fn(),
    };

    const onSuccessfulRefresh = vi.fn();
    const refresh = makeServeRefresh(
      server as never,
      { siteUrl: "https://example.com" },
      { root: "/repo", mode: "development" } as never,
      onSuccessfulRefresh,
    );

    await refresh.requestRefresh();

    expect(onSuccessfulRefresh).not.toHaveBeenCalled();
    expect(server.config.logger.error).toHaveBeenCalledWith(
      "Failed to generate site-index artifacts: refresh exploded",
    );
  });
});


