import { describe, expect, it, vi } from "vitest";
import { cli } from "./helpers/cli.js";
import { setupCommandMock } from "./helpers/command.setup.js";
import { withProject } from "./helpers/project.js";

const { runCheck } = vi.hoisted(() => ({
  runCheck: vi.fn(),
}));

vi.mock("../src/domains/site-indexes/check.service.js", () => ({
  runCheck,
}));

setupCommandMock(runCheck);

describe("check command rejections", () => {
  it("surfaces service failures", async () => {
    await withProject({}, async (project) => {
      runCheck.mockRejectedValue(new Error("Check failed with 1 warning(s)"));

      await expect(
        cli(
          "check",
          "--site-url",
          "https://example.com",
          "--root",
          project.root,
        ),
      ).rejects.toThrow("Check failed with 1 warning(s)");
    });
  });

  it("fails validation when --site-url is missing", async () => {
    await expect(cli("check")).rejects.toThrow(
      "Missing required option: --site-url <url>",
    );

    expect(runCheck).not.toHaveBeenCalled();
  });
});
