import NodePath from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cli } from "../../../helpers/cli.js";
import { withProject } from "../../../helpers/project.js";

const { runBuild } = vi.hoisted(() => ({
  runBuild: vi.fn(),
}));

vi.mock("../../../../src/domains/site-indexes/build.service.js", () => ({
  runBuild,
}));

beforeEach(() => {
  runBuild.mockReset();
});

afterEach(async () => {
  vi.restoreAllMocks();
});

describe("build command", () => {
  it("parses options with default root and out directory", async () => {
    await withProject({}, async (project) => {
      project.chdir();
      runBuild.mockResolvedValue(undefined);

      await cli("build", "--site-url", "https://example.com");

      expect(runBuild).toHaveBeenCalledWith({
        siteUrl: "https://example.com",
        rootPath: project.root,
        outPath: NodePath.resolve(project.root, "dist"),
      });
    });
  });

  it("resolves out and config relative to root", async () => {
    await withProject({}, async (project) => {
      const root = project.path("project");

      runBuild.mockResolvedValue(undefined);

      await cli(
        "build",
        "--site-url",
        "https://example.com",
        "--root",
        root,
        "--out",
        "output",
        "--config",
        "vite.config.ts",
      );

      expect(runBuild).toHaveBeenCalledWith({
        siteUrl: "https://example.com",
        rootPath: NodePath.resolve(root),
        outPath: NodePath.resolve(root, "output"),
        configFile: NodePath.resolve(root, "vite.config.ts"),
      });
    });
  });
});
