import NodeFS from "node:fs/promises";
import NodePath from "node:path";
import type { Artifact } from "@site-index/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runBuild } from "../../../src/domains/site-indexes/build.service.js";
import { withProject } from "../../helpers/project.js";
import { captureStreams } from "../../helpers/streams.js";

const runtimeMocks = vi.hoisted(() => {
  const runtime = {
    buildArtifacts: vi.fn(),
    close: vi.fn(async () => {}),
  };

  const builder = {
    withOptions: vi.fn(() => ({
      withViteConfig: vi.fn(() => ({
        build: vi.fn(() => runtime),
      })),
    })),
  };

  return {
    createRuntimeService: vi.fn(() => builder),
    runtime,
    builder,
  };
});

vi.mock("@site-index/vite-runtime", () => ({
  createRuntimeService: runtimeMocks.createRuntimeService,
}));

beforeEach(() => {
  runtimeMocks.runtime.buildArtifacts.mockReset();
  runtimeMocks.runtime.close.mockReset();
  runtimeMocks.builder.withOptions.mockClear();
  runtimeMocks.createRuntimeService.mockClear();
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

    expect(output.stderr()).toContain("Warning: Missing alternate");
    expect(output.stderr()).toContain("\tat src/a.ts");
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
});
