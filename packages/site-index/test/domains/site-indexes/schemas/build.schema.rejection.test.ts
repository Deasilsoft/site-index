import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { BuildConfigSchema } from "../../../../src/domains/site-indexes/schemas/build.schema.js";
import { withProject } from "../../../helpers/project.js";

describe("BuildConfigSchema rejections", () => {
  it("rejects missing site-url", async () => {
    await withProject({}, async (project) => {
      project.chdir();
      expect(() => BuildConfigSchema.parse({ root: project.root })).toThrow(
        "Missing required option: --site-url <url>",
      );
    });
  });

  it("rejects invalid site-url", async () => {
    await withProject({}, async (project) => {
      expect(() =>
        BuildConfigSchema.parse({
          siteUrl: "invalid",
          root: project.root,
        }),
      ).toThrow("Invalid option: --site-url must be a valid URL");
    });
  });

  it("rejects config paths that escape root", async () => {
    await withProject({}, async (project) => {
      expect(() =>
        BuildConfigSchema.parse({
          siteUrl: "https://example.com",
          root: project.root,
          config: "../vite.config.ts",
        }),
      ).toThrow("Invalid option: --config must resolve within --root");
    });
  });

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

  it("rejects absolute config paths outside root", async () => {
    await withProject({}, async (project) => {
      expect(() =>
        BuildConfigSchema.parse({
          siteUrl: "https://example.com",
          root: project.root,
          config: NodePath.resolve(project.root, "..", "vite.config.ts"),
        }),
      ).toThrow("Invalid option: --config must resolve within --root");
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
