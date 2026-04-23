import { describe, expect, it, vi } from "vitest";
import { resolveOptions } from "../src/domains/options/options.resolve.js";
import { main, type ModuleLoader } from "../src/index.js";

type InvalidOptionsCase = {
  name: string;
  input:
    | Omit<Parameters<typeof main>[0], "loadModule">
    | {
        siteUrl: string;
        rootPath: string;
        extensions?: string[];
        loadModule: unknown;
      };
  message: string;
};

const validLoader: ModuleLoader = async () => ({
  siteIndexes: [],
});

const invalidOptionsCases: InvalidOptionsCase[] = [
  {
    name: "invalid siteUrl",
    input: { siteUrl: "not-a-url", rootPath: "/repo" },
    message: "Invalid URL",
  },
  {
    name: "blank rootPath",
    input: { siteUrl: "https://example.com", rootPath: "   " },
    message: "Too small",
  },
  {
    name: "invalid extension format",
    input: {
      siteUrl: "https://example.com",
      rootPath: "/repo",
      extensions: ["ts"],
    },
    message: "must match pattern",
  },
  {
    name: "non-function loadModule",
    input: {
      siteUrl: "https://example.com",
      rootPath: "/repo",
      loadModule: "not-a-function",
    },
    message: "loadModule must be a function",
  },
];

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

    it.each(invalidOptionsCases)(
      "throws for invalid input ($name)",
      ({ input, message }) => {
        const options = {
          ...input,
          loadModule: "loadModule" in input ? input.loadModule : validLoader,
        } as Parameters<typeof resolveOptions>[0];

        expect(() => resolveOptions(options)).toThrow(message);
      },
    );
  });

  describe("main option validation", () => {
    it.each(invalidOptionsCases)(
      "rejects before pipeline work for invalid input ($name)",
      async ({ input, message }) => {
        const loadModule = vi.fn<ModuleLoader>(async () => ({
          siteIndexes: [],
        }));

        const options = {
          ...input,
          loadModule: "loadModule" in input ? input.loadModule : loadModule,
        } as Parameters<typeof main>[0];

        await expect(main(options)).rejects.toThrow(message);
        expect(loadModule).not.toHaveBeenCalled();
      },
    );
  });
});
