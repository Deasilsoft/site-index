import NodeFS from "node:fs/promises";
import NodePath from "node:path";
import type { Artifact } from "@site-index/core";
import * as ViteRuntime from "@site-index/vite-runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runBuild } from "../src/domains/site-indexes/build.service.js";
import { withProject } from "./helpers/project.js";
import { createRuntimeServiceMock } from "./helpers/runtime.service.mock.js";
import { captureStreams } from "./helpers/streams.js";

const runtimeMocks = createRuntimeServiceMock();

beforeEach(() => {
  runtimeMocks.reset();
  vi.spyOn(ViteRuntime, "createRuntimeService").mockImplementation(
    runtimeMocks.createRuntimeService as never,
  );
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

  it("rejects artifacts that escape output directory", async () => {
    runtimeMocks.runtime.buildArtifacts.mockResolvedValue({
      data: [{ filePath: "../escape.txt", content: "oops" }],
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

    const resolvedConfig = (
      runtimeMocks.withViteConfig.mock.calls as unknown as Array<
        [Record<string, unknown>]
      >
    )[0]?.[0];

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

    const resolvedConfig = (
      runtimeMocks.withViteConfig.mock.calls as unknown as Array<
        [Record<string, unknown>]
      >
    )[0]?.[0];
    expect(resolvedConfig).toMatchObject({
      root: "/project",
      mode: "production",
      configFile: "/project/vite.config.ts",
    });
  });
});
