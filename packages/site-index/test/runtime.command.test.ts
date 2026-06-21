import NodePath from "node:path";
import { describe, expect, it, vi } from "vitest";
import { cli } from "./helpers/cli.js";
import { setupCommandMock } from "./helpers/command.setup.js";
import { withProject } from "./helpers/project.js";

const { runRuntime } = vi.hoisted(() => ({
  runRuntime: vi.fn(),
}));

vi.mock("../src/domains/site-indexes/runtime.service.js", () => ({
  runRuntime,
}));

setupCommandMock(runRuntime);

describe("runtime command", () => {
  it("parses options with default root, entry, and out paths", async () => {
    await withProject({}, async (project) => {
      project.chdir();
      runRuntime.mockImplementation(async () => {});

      await cli("runtime", "--site-url", "https://example.com");

      expect(runRuntime).toHaveBeenCalledWith({
        siteUrl: "https://example.com",
        rootPath: project.root,
        entryPath: NodePath.resolve(project.root, "dist/server/site-index.runtime.mjs"),
        outPath: NodePath.resolve(project.root, "dist"),
      });
    });
  });

  it("resolves explicit entry and out relative to root", async () => {
    await withProject({}, async (project) => {
      const root = project.path("project");

      runRuntime.mockImplementation(async () => {});

      await cli(
        "runtime",
        "--site-url",
        "https://example.com",
        "--root",
        root,
        "--entry",
        "server/runtime.mjs",
        "--out",
        "public",
      );

      expect(runRuntime).toHaveBeenCalledWith({
        siteUrl: "https://example.com",
        rootPath: NodePath.resolve(root),
        entryPath: NodePath.resolve(root, "server/runtime.mjs"),
        outPath: NodePath.resolve(root, "public"),
      });
    });
  });
});
