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

describe("build command rejections", () => {
  it("rejects artifact path traversal", async () => {
    await withProject({}, async (project) => {
      runBuild.mockRejectedValue(
        new Error("Artifact path escapes output directory: ../escape.txt"),
      );

      await expect(
        cli(
          "build",
          "--site-url",
          "https://example.com",
          "--root",
          project.root,
        ),
      ).rejects.toThrow(
        "Artifact path escapes output directory: ../escape.txt",
      );
    });
  });

  it("fails validation when --site-url is missing", async () => {
    await expect(cli("build")).rejects.toThrow(
      "Missing required option: --site-url <url>",
    );
    expect(runBuild).not.toHaveBeenCalled();
  });

  it("fails validation for invalid --site-url", async () => {
    await expect(cli("build", "--site-url", "not-a-url")).rejects.toThrow(
      "Invalid option: --site-url must be a valid URL",
    );
    expect(runBuild).not.toHaveBeenCalled();
  });

  it("fails validation when --out escapes --root", async () => {
    await withProject({}, async (project) => {
      await expect(
        cli(
          "build",
          "--site-url",
          "https://example.com",
          "--root",
          project.root,
          "--out",
          "../dist",
        ),
      ).rejects.toThrow("Invalid option: --out must resolve within --root");
      expect(runBuild).not.toHaveBeenCalled();
    });
  });

  it("fails validation when --config is absolute and outside --root", async () => {
    await withProject({}, async (project) => {
      await expect(
        cli(
          "build",
          "--site-url",
          "https://example.com",
          "--root",
          project.root,
          "--config",
          NodePath.resolve(project.root, "..", "vite.config.ts"),
        ),
      ).rejects.toThrow("Invalid option: --config must resolve within --root");
      expect(runBuild).not.toHaveBeenCalled();
    });
  });

  it("fails validation when --config escapes --root", async () => {
    await withProject({}, async (project) => {
      await expect(
        cli(
          "build",
          "--site-url",
          "https://example.com",
          "--root",
          project.root,
          "--config",
          "../vite.config.ts",
        ),
      ).rejects.toThrow("Invalid option: --config must resolve within --root");
      expect(runBuild).not.toHaveBeenCalled();
    });
  });

  it("fails validation when --out is absolute and outside --root", async () => {
    await withProject({}, async (project) => {
      await expect(
        cli(
          "build",
          "--site-url",
          "https://example.com",
          "--root",
          project.root,
          "--out",
          NodePath.resolve(project.root, "..", "dist"),
        ),
      ).rejects.toThrow("Invalid option: --out must resolve within --root");
      expect(runBuild).not.toHaveBeenCalled();
    });
  });
});
