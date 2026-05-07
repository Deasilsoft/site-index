import NodeFS from "node:fs/promises";
import NodePath from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runMake } from "../src/domains/make/make.service.js";
import { MakeConfigSchema } from "../src/domains/make/schemas/make.schema.js";
import { cli } from "./helpers/cli.js";
import { withProject } from "./helpers/project.js";
import { captureStreams } from "./helpers/streams.js";

afterEach(async () => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("make command rejections", () => {
  it("rejects file paths outside the current working directory", async () => {
    await withProject({}, async (project) => {
      project.chdir();

      await expect(cli("make", "../outside")).rejects.toThrow(
        "File path must stay within the current working directory",
      );
    });
  });

  it("rejects invalid formats", async () => {
    await withProject({}, async (project) => {
      project.chdir();

      await expect(
        cli("make", "content/about", "--format", "cjs"),
      ).rejects.toThrow("Invalid option: --format must be one of: ts, esm");
    });
  });

  it("throws when target file exists without --force", async () => {
    await withProject({}, async (project) => {
      project.chdir();

      const config = MakeConfigSchema.parse({
        filePath: "content/duplicate",
        force: false,
      });

      await NodeFS.mkdir(NodePath.dirname(config.outputFilePath), {
        recursive: true,
      });

      await NodeFS.writeFile(config.outputFilePath, "ORIGINAL", "utf8");

      const output = captureStreams();

      try {
        await expect(runMake(config)).rejects.toThrow(
          `Refusing to overwrite existing file: ${config.outputFilePath} (use --force)`,
        );
      } finally {
        output.restore();
      }

      const content = await NodeFS.readFile(config.outputFilePath, "utf8");

      expect(content).toBe("ORIGINAL");
      expect(output.stdout()).not.toContain("Created file:");
    });
  });

  it("propagates generator setup failures", async () => {
    await withProject({}, async (project) => {
      project.chdir();

      const config = MakeConfigSchema.parse({
        filePath: "x",
        force: true,
      });

      const output = captureStreams();

      vi.spyOn(Date.prototype, "toISOString").mockImplementation(() => {
        throw new Error("clock failed");
      });

      try {
        await expect(runMake(config)).rejects.toThrow("clock failed");
      } finally {
        output.restore();
      }

      expect(output.stderr()).not.toContain("Failed to create file:");
    });
  });

  it("propagates makeSiteIndexModule failures without extra logging", async () => {
    await withProject({}, async (project) => {
      const makeSiteIndexModule = vi.fn(async () => {
        throw new Error("template read failed");
      });

      vi.doMock("../src/domains/make/adapters/site-index.js", () => ({
        makeSiteIndexModule,
      }));

      const output = captureStreams();
      const { runMake: runMockedMake } =
        await import("../src/domains/make/make.service.js");

      try {
        await expect(
          runMockedMake({
            filePath: "content/a",
            format: "ts",
            force: true,
            outputFilePath: NodePath.resolve(
              project.root,
              "content/a.site-index.ts",
            ),
          }),
        ).rejects.toThrow("template read failed");
      } finally {
        output.restore();
      }

      expect(output.stderr()).not.toContain("Failed to create file:");
      expect(output.stdout()).not.toContain("Created file:");
    });
  });

  it("rethrows non-ENOENT access errors from file existence check", async () => {
    await withProject({}, async (project) => {
      project.chdir();

      const config = MakeConfigSchema.parse({
        filePath: "content/denied",
        force: false,
      });

      vi.spyOn(NodeFS, "access").mockRejectedValue(
        Object.assign(new Error("permission denied"), { code: "EACCES" }),
      );

      await expect(runMake(config)).rejects.toThrow("permission denied");
    });
  });
});
