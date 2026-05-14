import { Artifact } from "@site-index/core";
import NodeFS from "node:fs/promises";
import NodePath from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getRuntimeMocks } from "./helpers/runtime.js";
import { runBuild } from "../src/domains/site-indexes/build.service.js";
import { getFirstMockArgument } from "./helpers/mock.js";
import { withProject } from "./helpers/project.js";
import { captureStreams } from "./helpers/streams.js";

const runtimeMocks = getRuntimeMocks();

function getFirstResolvedViteConfig(): Record<string, unknown> {
  return getFirstMockArgument<Record<string, unknown>>(
    runtimeMocks.withViteConfig,
    "withViteConfig",
  );
}

beforeEach(() => {
  runtimeMocks.reset();
});

afterEach(async () => {
  vi.restoreAllMocks();
});

describe("build service", () => {
  it("writes artifacts to disk", async () => {
    await withProject({}, async (project) => {
      const outPath = project.path("dist");
      const artifacts = [
        new Artifact({
          filePath: "robots.txt",
          content: "robots",
        }),
        new Artifact({
          filePath: "nested/sitemap.xml",
          content: "sitemap",
        }),
      ];

      runtimeMocks.runtime.buildArtifacts.mockResolvedValue({
        data: artifacts,
        warnings: [],
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

    runtimeMocks.runtime.buildArtifacts.mockResolvedValue({
      data: [],
      warnings: [{ message: "Missing alternate", filePath: "src/a.ts" }],
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

    expect(output.stderr()).toContain("Warning: src/a.ts: Missing alternate");
  });

  it("rejects artifact paths that escape output directory", async () => {
    runtimeMocks.runtime.buildArtifacts.mockResolvedValue({
      data: [
        new Artifact({
          filePath: "../escape.txt",
          content: "oops",
        }),
      ],
      warnings: [],
    });

    await expect(
      runBuild({
        siteUrl: "https://example.com",
        rootPath: "/project",
        outPath: "/project/dist",
      }),
    ).rejects.toThrow("Artifact path escapes output directory: ../escape.txt");
  });

  it("closes runtime when buildArtifacts throws", async () => {
    runtimeMocks.runtime.buildArtifacts.mockRejectedValue(new Error("boom"));

    await expect(
      runBuild({
        siteUrl: "https://example.com",
        rootPath: "/project",
        outPath: "/project/dist",
      }),
    ).rejects.toThrow("boom");

    expect(runtimeMocks.runtime.close).toHaveBeenCalledTimes(1);
  });

  it("keeps Vite config discovery enabled when --config is not provided", async () => {
    runtimeMocks.runtime.buildArtifacts.mockResolvedValue({
      data: [],
      warnings: [],
    });

    await runBuild({
      siteUrl: "https://example.com",
      rootPath: "/project",
      outPath: "/project/dist",
    });

    const resolvedConfig = getFirstResolvedViteConfig();

    expect(resolvedConfig).toMatchObject({
      root: "/project",
      mode: "production",
    });

    expect(resolvedConfig).not.toHaveProperty("configFile");
  });

  it("passes explicit configFile when --config is provided", async () => {
    runtimeMocks.runtime.buildArtifacts.mockResolvedValue({
      data: [],
      warnings: [],
    });

    await runBuild({
      siteUrl: "https://example.com",
      rootPath: "/project",
      outPath: "/project/dist",
      configFile: "/project/vite.config.ts",
    });

    const resolvedConfig = getFirstResolvedViteConfig();

    expect(resolvedConfig).toMatchObject({
      root: "/project",
      mode: "production",
      configFile: "/project/vite.config.ts",
    });
  });
});
