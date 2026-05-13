import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { BuildConfigSchema } from "../src/domains/site-indexes/schemas/build.schema.js";
import { withProject } from "./helpers/project.js";

describe("BuildConfigSchema rejections", () => {
  it("rejects out paths that escape root", async () => {
    await withProject({}, async (project) => {
      expect(() =>
        BuildConfigSchema.parse({
          siteUrl: "https://example.com",
          root: project.root,
          out: "../dist",
        }),
      ).toThrow("Invalid option: --out must resolve within --root");
    });
  });

  it("rejects absolute out paths outside root", async () => {
    await withProject({}, async (project) => {
      expect(() =>
        BuildConfigSchema.parse({
          siteUrl: "https://example.com",
          root: project.root,
          out: NodePath.resolve(project.root, "..", "dist"),
        }),
      ).toThrow("Invalid option: --out must resolve within --root");
    });
  });
});
