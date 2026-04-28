import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { MakeConfigSchema } from "../../../../src/domains/make/schemas/make.schema.js";
import { withProject } from "../../../helpers/project.js";

describe("MakeConfigSchema", () => {
  it("uses default format and force", async () => {
    await withProject({}, async (project) => {
      project.chdir();
      const config = MakeConfigSchema.parse({ filePath: "content/about" });

      expect(config.format).toBe("ts");
      expect(config.force).toBe(false);
      expect(config.outputFilePath).toBe(
        NodePath.resolve(project.root, "content/about.site-index.ts"),
      );
    });
  });

  it("maps extensions by format", async () => {
    await withProject({}, async (project) => {
      project.chdir();

      const tsConfig = MakeConfigSchema.parse({ filePath: "a", format: "ts" });
      const esmConfig = MakeConfigSchema.parse({
        filePath: "b",
        format: "esm",
      });

      expect(tsConfig.outputFilePath.endsWith(".site-index.ts")).toBe(true);
      expect(esmConfig.outputFilePath.endsWith(".site-index.mjs")).toBe(true);
    });
  });

  it("maps plain and extension inputs to .site-index.ts by default", async () => {
    await withProject({}, async (project) => {
      project.chdir();

      const fromPlain = MakeConfigSchema.parse({ filePath: "about" });
      const fromTs = MakeConfigSchema.parse({ filePath: "about.ts" });

      expect(fromPlain.outputFilePath).toBe(
        NodePath.resolve(project.root, "about.site-index.ts"),
      );
      expect(fromTs.outputFilePath).toBe(
        NodePath.resolve(project.root, "about.site-index.ts"),
      );
    });
  });

  it("keeps esm selection explicit for .mjs input", async () => {
    await withProject({}, async (project) => {
      project.chdir();

      const config = MakeConfigSchema.parse({
        filePath: "about.mjs",
        format: "esm",
      });

      expect(config.outputFilePath).toBe(
        NodePath.resolve(project.root, "about.site-index.mjs"),
      );
    });
  });

  it("normalizes existing site-index extension", async () => {
    await withProject({}, async (project) => {
      project.chdir();

      const fromSiteIndex = MakeConfigSchema.parse({
        filePath: "nested/page.site-index.ts",
        format: "ts",
      });

      const fromRegular = MakeConfigSchema.parse({
        filePath: "nested/page.mjs",
        format: "esm",
      });

      expect(fromSiteIndex.outputFilePath).toBe(
        NodePath.resolve(project.root, "nested/page.site-index.ts"),
      );
      expect(fromRegular.outputFilePath).toBe(
        NodePath.resolve(project.root, "nested/page.site-index.mjs"),
      );
    });
  });

  it("preserves nested directory structure", async () => {
    await withProject({}, async (project) => {
      project.chdir();

      const config = MakeConfigSchema.parse({ filePath: "nested/about" });

      expect(config.outputFilePath).toBe(
        NodePath.resolve(project.root, "nested/about.site-index.ts"),
      );
    });
  });
});
