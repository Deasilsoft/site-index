import NodeFS from "node:fs/promises";
import NodePath from "node:path";
import type { Artifact } from "@site-index/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runBuild } from "../../../src/domains/site-indexes/build.service.js";
import { withProject } from "../../helpers/project.js";
import { captureStreams } from "../../helpers/streams.js";

const runtimeMocks = vi.hoisted(() => {
  let warningListener:
    | ((warning: { message: string; filePath?: string }) => void)
    | undefined;

  const runtime = {
    runSiteIndex: vi.fn(),
    onWarning: vi.fn(
      (listener: (warning: { message: string; filePath?: string }) => void) => {
        warningListener = listener;

        return () => {
          warningListener = undefined;
        };
      },
    ),
    close: vi.fn(async () => {}),
  };

  return {
    makeViteSiteIndexService: vi.fn(() => runtime),
    runtime,
    emitWarning: (warning: { message: string; filePath?: string }) => {
      warningListener?.(warning);
    },
  };
});

vi.mock("@site-index/vite-runtime", () => ({
  makeViteSiteIndexService: runtimeMocks.makeViteSiteIndexService,
}));

beforeEach(() => {
  runtimeMocks.runtime.runSiteIndex.mockReset();
  runtimeMocks.runtime.onWarning.mockClear();
  runtimeMocks.runtime.close.mockReset();
});

afterEach(async () => {
  vi.restoreAllMocks();
});

describe("build service", () => {
  it("writes artifacts to disk and strips leading slashes", async () => {
    await withProject({}, async (project) => {
      const outPath = project.path("dist");
      const artifacts: Artifact[] = [
        {
          filePath: "/robots.txt",
          content: "robots",
          contentType: "text/plain; charset=utf-8",
        },
        {
          filePath: "nested/sitemap.xml",
          content: "sitemap",
          contentType: "application/xml; charset=utf-8",
        },
      ];

      runtimeMocks.runtime.runSiteIndex.mockResolvedValue({
        artifacts,
        loadedModules: [],
      });

      await runBuild({
        siteUrl: "https://example.com",
        rootPath: project.root,
        outPath,
      });

      await expect(
        NodeFS.readFile(NodePath.join(outPath, "robots.txt"), "utf8"),
      ).resolves.toBe("robots");
      await expect(
        NodeFS.readFile(NodePath.join(outPath, "nested/sitemap.xml"), "utf8"),
      ).resolves.toBe("sitemap");
    });
  });

  it("prints warnings through logger.warn", async () => {
    const output = captureStreams();

    runtimeMocks.runtime.runSiteIndex.mockImplementation(async () => {
      runtimeMocks.emitWarning({
        message: "Missing alternate",
        filePath: "src/a.ts",
      });

      return {
        artifacts: [],
        loadedModules: [],
      };
    });

    try {
      await runBuild({
        siteUrl: "https://example.com",
        rootPath: "/project",
        outPath: "/project/dist",
      });
    } finally {
      output.restore();
    }

    expect(output.stderr()).toContain("Warning: Missing alternate");
    expect(output.stderr()).toContain("\tat src/a.ts");
  });

  it("rejects artifacts that escape output directory", async () => {
    runtimeMocks.runtime.runSiteIndex.mockResolvedValue({
      artifacts: [{ filePath: "../escape.txt", content: "oops" }],
      loadedModules: [],
    });

    await expect(
      runBuild({
        siteUrl: "https://example.com",
        rootPath: "/project",
        outPath: "/project/dist",
      }),
    ).rejects.toThrow("Artifact path escapes output directory: ../escape.txt");
  });
});
