import NodeFS from "node:fs/promises";
import NodePath from "node:path";
import { describe, expect, it } from "vitest";

const PACKAGE_ROOT = NodePath.resolve(import.meta.dirname, "..");

describe("npm pack", () => {
  it("includes built CLI entrypoint and copied templates", async () => {
    const entrypointPath = NodePath.join(PACKAGE_ROOT, "dist/bin.js");
    const templateTsPath = NodePath.join(
      PACKAGE_ROOT,
      "dist/domains/make/templates/site-index.ts.hbs",
    );
    const templateEsmPath = NodePath.join(
      PACKAGE_ROOT,
      "dist/domains/make/templates/site-index.esm.hbs",
    );

    const [entrypointStats, tsTemplateContent, esmTemplateContent] =
      await Promise.all([
        NodeFS.stat(entrypointPath),
        NodeFS.readFile(templateTsPath, "utf8"),
        NodeFS.readFile(templateEsmPath, "utf8"),
      ]);

    expect(entrypointStats.isFile()).toBe(true);
    expect(entrypointStats.mode & 0o111).toBeGreaterThan(0);
    expect(tsTemplateContent).toContain('lastModified: "{{lastModified}}"');
    expect(esmTemplateContent).toContain('lastModified: "{{lastModified}}"');
  });
});
