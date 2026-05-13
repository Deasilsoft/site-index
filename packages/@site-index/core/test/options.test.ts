import { describe, expect, it } from "vitest";
import { resolveOptions } from "../src/domains/options/options.resolve.js";
import { type LoadModule } from "../src/index.js";

const validLoader: LoadModule = async () => ({
  siteIndexes: [],
});

describe("options", () => {
  describe("resolveOptions", () => {
    it("normalizes siteUrl/rootPath and applies default extensions", () => {
      const result = resolveOptions({
        siteUrl: "https://example.com///",
        rootPath: "  /repo  ",
        loadModule: validLoader,
      });

      expect(result).toEqual({
        siteUrl: "https://example.com",
        rootPath: "/repo",
        extensions: [".js", ".mjs", ".ts"],
        loadModule: validLoader,
      });
    });

    it("keeps explicit extensions and passthrough values", () => {
      const result = resolveOptions({
        siteUrl: "https://example.com",
        rootPath: "/repo",
        extensions: [".ts", ".tsx"],
        loadModule: validLoader,
      });

      expect(result.extensions).toEqual([".ts", ".tsx"]);
      expect(result.siteUrl).toBe("https://example.com");
      expect(result.rootPath).toBe("/repo");
      expect(result.loadModule).toBe(validLoader);
    });
  });
});
