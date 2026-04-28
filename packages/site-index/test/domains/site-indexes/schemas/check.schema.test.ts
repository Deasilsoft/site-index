import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { CheckConfigSchema } from "../../../../src/domains/site-indexes/schemas/check.schema.js";
import { withProject } from "../../../helpers/project.js";

describe("CheckConfigSchema", () => {
  it("resolves root path", async () => {
    await withProject({}, async (project) => {
      const config = CheckConfigSchema.parse({
        siteUrl: "https://example.com",
        root: project.root,
      });

      expect(config.rootPath).toBe(NodePath.resolve(project.root));
      expect(config.configFile).toBeUndefined();
    });
  });

  it("resolves config path relative to root", async () => {
    await withProject({}, async (project) => {
      const config = CheckConfigSchema.parse({
        siteUrl: "https://example.com",
        root: project.root,
        config: "vite.config.ts",
      });

      expect(config.configFile).toBe(
        NodePath.resolve(project.root, "vite.config.ts"),
      );
    });
  });
});
