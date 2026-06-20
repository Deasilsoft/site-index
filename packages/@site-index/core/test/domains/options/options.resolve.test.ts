import { describe, expect, it } from "vitest";
import { resolveOptions } from "../../../src/domains/options/options.resolve.js";
import { type LoadModule } from "../../../src/index.js";

const validSiteUrls = [
  ["https://cloudini.org", "https://cloudini.org"],
  ["https://cloudini.org/", "https://cloudini.org"],
  ["http://localhost:5173", "http://localhost:5173"],
  ["http://127.0.0.1:5173", "http://127.0.0.1:5173"],
] as const;

const validLoader: LoadModule = async () => ({
  siteIndexes: [],
});

describe("resolveOptions", () => {
  it("normalizes rootPath and applies default extensions", () => {
    const result = resolveOptions({
      siteUrl: "https://example.com",
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

  it("trims siteUrl before validation", () => {
    const result = resolveOptions({
      siteUrl: "  https://example.com/  ",
      rootPath: "/repo",
      loadModule: validLoader,
    });

    expect(result.siteUrl).toBe("https://example.com");
  });

  it.each(validSiteUrls)("accepts %s", (siteUrl, expectedOrigin) => {
    const result = resolveOptions({
      siteUrl,
      rootPath: "/repo",
      loadModule: validLoader,
    });

    expect(result.siteUrl).toBe(expectedOrigin);
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
