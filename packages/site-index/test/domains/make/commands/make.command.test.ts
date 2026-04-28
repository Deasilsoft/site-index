import NodeFS from "node:fs/promises";
import NodePath from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runMake } from "../../../../src/domains/make/make.service.js";
import { MakeConfigSchema } from "../../../../src/domains/make/schemas/make.schema.js";
import { cli } from "../../../helpers/cli.js";
import { withProject } from "../../../helpers/project.js";
import { captureStreams } from "../../../helpers/streams.js";

afterEach(async () => {
  vi.restoreAllMocks();
});

describe("make command", () => {
  it("creates a TypeScript file by default", async () => {
    await withProject({}, async (project) => {
      project.chdir();
      const output = captureStreams();

      try {
        await cli("make", "content/about");
      } finally {
        output.restore();
      }

      const filePath = NodePath.resolve(
        project.root,
        "content/about.site-index.ts",
      );
      const content = await NodeFS.readFile(filePath, "utf8");

      expect(content).toContain('import type { SiteIndex } from "site-index";');
      expect(content).toContain("export default { siteIndexes };");
      expect(output.stdout()).toContain(`Created file: ${filePath}`);
    });
  });

  it("creates an ESM file when --format esm is passed", async () => {
    await withProject({}, async (project) => {
      project.chdir();
      await cli("make", "content/blog", "--format", "esm");

      const filePath = NodePath.resolve(
        project.root,
        "content/blog.site-index.mjs",
      );
      const content = await NodeFS.readFile(filePath, "utf8");

      expect(content).toContain(
        '/** @type {import("site-index").SiteIndex[]} */',
      );
    });
  });

  it("normalizes filename and creates missing directories", async () => {
    await withProject({}, async (project) => {
      project.chdir();
      await cli("make", "nested/a/page.site-index.ts");

      const filePath = NodePath.resolve(
        project.root,
        "nested/a/page.site-index.ts",
      );
      const stats = await NodeFS.stat(filePath);

      expect(stats.isFile()).toBe(true);
    });
  });

  it("overwrites existing file when --force is used", async () => {
    await withProject({}, async (project) => {
      project.chdir();
      const config = MakeConfigSchema.parse({
        filePath: "content/duplicate",
        force: true,
      });

      await NodeFS.mkdir(NodePath.dirname(config.outputFilePath), {
        recursive: true,
      });
      await NodeFS.writeFile(config.outputFilePath, "ORIGINAL", "utf8");

      const output = captureStreams();

      try {
        await runMake(config);
      } finally {
        output.restore();
      }

      const content = await NodeFS.readFile(config.outputFilePath, "utf8");
      expect(content).not.toBe("ORIGINAL");
      expect(output.stdout()).toContain(
        `Created file: ${config.outputFilePath}`,
      );
    });
  });

  it("renders lastModified template variable", async () => {
    await withProject({}, async (project) => {
      project.chdir();
      vi.spyOn(Date.prototype, "toISOString").mockReturnValue(
        "2026-01-01T00:00:00.000Z",
      );

      await cli("make", "content/date-check");

      const content = await NodeFS.readFile(
        NodePath.resolve(project.root, "content/date-check.site-index.ts"),
        "utf8",
      );

      expect(content).toContain('lastModified: "2026-01-01T00:00:00.000Z"');
    });
  });
});
