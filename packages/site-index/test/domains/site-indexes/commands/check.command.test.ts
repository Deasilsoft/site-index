import NodePath from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cli } from "../../../helpers/cli.js";
import { withProject } from "../../../helpers/project.js";

const { runCheck } = vi.hoisted(() => ({
  runCheck: vi.fn(),
}));

vi.mock("../../../../src/domains/site-indexes/check.service.js", () => ({
  runCheck,
}));

beforeEach(() => {
  runCheck.mockReset();
});

afterEach(async () => {
  vi.restoreAllMocks();
});

describe("check command", () => {
  it("parses options with default root", async () => {
    await withProject({}, async (project) => {
      project.chdir();
      runCheck.mockResolvedValue(undefined);

      await cli("check", "--site-url", "https://example.com");

      expect(runCheck).toHaveBeenCalledWith({
        siteUrl: "https://example.com",
        rootPath: project.root,
      });
    });
  });

  it("resolves config relative to root", async () => {
    await withProject({}, async (project) => {
      const root = project.path("project");
      runCheck.mockResolvedValue(undefined);

      await cli(
        "check",
        "--site-url",
        "https://example.com",
        "--root",
        root,
        "--config",
        "vite.config.ts",
      );

      expect(runCheck).toHaveBeenCalledWith({
        siteUrl: "https://example.com",
        rootPath: NodePath.resolve(root),
        configFile: NodePath.resolve(root, "vite.config.ts"),
      });
    });
  });
});
