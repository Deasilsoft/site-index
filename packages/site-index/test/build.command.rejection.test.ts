import { describe, expect, it, vi } from "vitest";
import { cli } from "./helpers/cli.js";
import { setupCommandMock } from "./helpers/command.setup.js";
import { withProject } from "./helpers/project.js";

const { runBuild } = vi.hoisted(() => ({
  runBuild: vi.fn(),
}));

vi.mock("../src/domains/site-indexes/build.service.js", () => ({
  runBuild,
}));

setupCommandMock(runBuild);

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
});
