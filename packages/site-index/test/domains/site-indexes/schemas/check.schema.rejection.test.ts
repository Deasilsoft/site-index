import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { CheckConfigSchema } from "../../../../src/domains/site-indexes/schemas/check.schema.js";
import { withProject } from "../../../helpers/project.js";

describe("CheckConfigSchema rejections", () => {
  it("rejects missing site-url", async () => {
    await withProject({}, async (project) => {
      project.chdir();
      expect(() => CheckConfigSchema.parse({ root: project.root })).toThrow(
        "Missing required option: --site-url <url>",
      );
    });
  });

  it("rejects invalid site-url", async () => {
    await withProject({}, async (project) => {
      expect(() =>
        CheckConfigSchema.parse({
          siteUrl: "invalid",
          root: project.root,
        }),
      ).toThrow("Invalid option: --site-url must be a valid URL");
    });
  });

  it("rejects config paths that escape root", async () => {
    await withProject({}, async (project) => {
      expect(() =>
        CheckConfigSchema.parse({
          siteUrl: "https://example.com",
          root: project.root,
          config: "../vite.config.ts",
        }),
      ).toThrow("Invalid option: --config must resolve within --root");
    });
  });

  it("rejects absolute config paths outside root", async () => {
    await withProject({}, async (project) => {
      expect(() =>
        CheckConfigSchema.parse({
          siteUrl: "https://example.com",
          root: project.root,
          config: NodePath.resolve(project.root, "..", "vite.config.ts"),
        }),
      ).toThrow("Invalid option: --config must resolve within --root");
    });
  });
});
