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

describe("check command rejections", () => {
  it("fails validation when --site-url is missing", async () => {
    await expect(cli("check")).rejects.toThrow(
      "Missing required option: --site-url <url>",
    );
    expect(runCheck).not.toHaveBeenCalled();
  });

  it("fails validation for invalid --site-url", async () => {
    await expect(cli("check", "--site-url", "bad")).rejects.toThrow(
      "Invalid option: --site-url must be a valid URL",
    );
    expect(runCheck).not.toHaveBeenCalled();
  });

  it("fails validation when --config escapes --root", async () => {
    await withProject({}, async (project) => {
      await expect(
        cli(
          "check",
          "--site-url",
          "https://example.com",
          "--root",
          project.root,
          "--config",
          "../vite.config.ts",
        ),
      ).rejects.toThrow("Invalid option: --config must resolve within --root");

      expect(runCheck).not.toHaveBeenCalled();
    });
  });

  it("fails validation when --config is absolute and outside --root", async () => {
    await withProject({}, async (project) => {
      await expect(
        cli(
          "check",
          "--site-url",
          "https://example.com",
          "--root",
          project.root,
          "--config",
          NodePath.resolve(project.root, "..", "vite.config.ts"),
        ),
      ).rejects.toThrow("Invalid option: --config must resolve within --root");

      expect(runCheck).not.toHaveBeenCalled();
    });
  });
});
