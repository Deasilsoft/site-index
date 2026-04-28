import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { BuildConfigSchema } from "../../../../src/domains/site-indexes/schemas/build.schema.js";
import { withProject } from "../../../helpers/project.js";

describe("BuildConfigSchema", () => {
  it("resolves root and default out path", async () => {
    await withProject({}, async (project) => {
      const config = BuildConfigSchema.parse({
        siteUrl: "https://example.com",
        root: project.root,
      });

      expect(config.rootPath).toBe(NodePath.resolve(project.root));
      expect(config.outPath).toBe(NodePath.resolve(project.root, "dist"));
    });
  });

  it("resolves out and config relative to root", async () => {
    await withProject({}, async (project) => {
      const config = BuildConfigSchema.parse({
        siteUrl: "https://example.com",
        root: project.root,
        out: "public/out",
        config: "vite.config.ts",
      });

      expect(config.outPath).toBe(NodePath.resolve(project.root, "public/out"));
      expect(config.configFile).toBe(
        NodePath.resolve(project.root, "vite.config.ts"),
      );
    });
  });
});
