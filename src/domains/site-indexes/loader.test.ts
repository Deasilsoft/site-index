import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadSiteIndexRegistry } from "./loader.js";

describe("loadSiteIndexRegistry", () => {
  let emptyDir: string;

  beforeEach(async () => {
    emptyDir = await mkdtemp(path.join(os.tmpdir(), "site-index-test-"));
  });

  afterEach(async () => {
    await rm(emptyDir, { recursive: true, force: true });
  });

  it("emits warning when context root has no site-index files", async () => {
    const result = await loadSiteIndexRegistry({
      root: emptyDir,
      ssrLoadModule: vi.fn(),
    });

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("No site-index modules found");
    expect(result.registry).toEqual({});
  });

  it("loads discovered modules via context.ssrLoadModule", async () => {
    const filePath = path.join(emptyDir, "about.site-index.ts");

    await writeFile(filePath, "export const siteIndexes = []\n", "utf8");

    const ssrLoadModule = vi.fn().mockResolvedValue({
      siteIndexes: [{ url: "/about" }],
    });

    const result = await loadSiteIndexRegistry({
      root: emptyDir,
      ssrLoadModule,
    });

    expect(ssrLoadModule).toHaveBeenCalledTimes(1);
    expect(result.warnings).toEqual([]);
    expect(result.registry["./about.site-index.ts"]).toEqual({
      siteIndexes: [{ url: "/about" }],
    });
  });
});
