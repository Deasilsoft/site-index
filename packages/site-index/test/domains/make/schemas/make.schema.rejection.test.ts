import { describe, expect, it } from "vitest";
import { MakeConfigSchema } from "../../../../src/domains/make/schemas/make.schema.js";
import { withProject } from "../../../helpers/project.js";

describe("MakeConfigSchema rejections", () => {
  it("rejects empty file paths", async () => {
    await withProject({}, async (project) => {
      project.chdir();
      expect(() => MakeConfigSchema.parse({ filePath: "   " })).toThrow(
        "File path is required",
      );
    });
  });

  it("rejects file paths outside cwd", async () => {
    await withProject({}, async (project) => {
      project.chdir();
      expect(() => MakeConfigSchema.parse({ filePath: "../outside" })).toThrow(
        "File path must stay within the current working directory",
      );
    });
  });

  it("rejects cwd root itself", async () => {
    await withProject({}, async (project) => {
      project.chdir();
      expect(() => MakeConfigSchema.parse({ filePath: "." })).toThrow(
        "File path must stay within the current working directory",
      );
    });
  });

  it("rejects invalid format", async () => {
    expect(() =>
      MakeConfigSchema.parse({
        filePath: "content/about",
        format: "cjs" as unknown as "ts",
      }),
    ).toThrow("Invalid option: --format must be one of: ts, esm");
  });
});
