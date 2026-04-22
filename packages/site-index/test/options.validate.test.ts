import { describe, expect, it } from "vitest";
import type { ModuleLoader } from "../src/index.js";
import { validateOptions } from "../src/index.js";

const loadModules: ModuleLoader = async () => ({ data: [], warnings: [] });

describe("validateOptions", () => {
  it("normalizes siteUrl and rootPath and applies default extensions", () => {
    const result = validateOptions({
      siteUrl: "https://example.com///",
      rootPath: "  /repo  ",
      loadModules,
    });

    expect(result).toEqual({
      siteUrl: "https://example.com",
      rootPath: "/repo",
      extensions: [".js", ".mjs", ".ts"],
      loadModules,
    });
  });

  it("keeps explicit extensions", () => {
    const result = validateOptions({
      siteUrl: "https://example.com",
      rootPath: "/repo",
      extensions: [".ts", ".tsx"],
      loadModules,
    });

    expect(result.extensions).toEqual([".ts", ".tsx"]);
  });

  it.each([
    [
      "invalid siteUrl",
      { siteUrl: "not-a-url", rootPath: "/repo", loadModules },
    ],
    [
      "blank rootPath",
      { siteUrl: "https://example.com", rootPath: "   ", loadModules },
    ],
    [
      "invalid extension format",
      {
        siteUrl: "https://example.com",
        rootPath: "/repo",
        extensions: ["ts"],
        loadModules,
      },
    ],
    [
      "non-function loadModules",
      {
        siteUrl: "https://example.com",
        rootPath: "/repo",
        loadModules: "not-a-function",
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
