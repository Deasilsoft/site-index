import { describe, expect, it } from "vitest";
import type { LoadModule } from "../src/index.js";
import { validateOptions } from "../src/index.js";

const loadModule: LoadModule = async () => ({ siteIndexes: [] });

describe("validateOptions", () => {
  it("normalizes siteUrl and rootPath and applies default extensions", () => {
    const result = validateOptions({
      siteUrl: "https://example.com///",
      rootPath: "  /repo  ",
      loadModule,
    });

    expect(result).toEqual({
      siteUrl: "https://example.com",
      rootPath: "/repo",
      extensions: [".js", ".mjs", ".ts"],
      loadModule,
    });
  });

  it("keeps explicit extensions", () => {
    const result = validateOptions({
      siteUrl: "https://example.com",
      rootPath: "/repo",
      extensions: [".ts", ".tsx"],
      loadModule,
    });

    expect(result.extensions).toEqual([".ts", ".tsx"]);
  });

  it.each([
    [
      "invalid siteUrl",
      { siteUrl: "not-a-url", rootPath: "/repo", loadModule },
    ],
    [
      "blank rootPath",
      {
        siteUrl: "https://example.com",
        rootPath: "   ",
        loadModule,
      },
    ],
    [
      "invalid extension format",
      {
        siteUrl: "https://example.com",
        rootPath: "/repo",
        extensions: ["ts"],
        loadModule,
      },
    ],
    [
      "non-function loadModule",
      {
        siteUrl: "https://example.com",
        rootPath: "/repo",
        loadModule: "not-a-function",
      },
    ],
  ])("throws for %s", (_name, input) => {
    expect(() =>
      validateOptions(
        input as unknown as Parameters<typeof validateOptions>[0],
      ),
    ).toThrow();
  });
});
