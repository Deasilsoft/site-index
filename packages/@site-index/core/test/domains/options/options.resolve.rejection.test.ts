import { describe, expect, it, vi } from "vitest";
import { resolveOptions } from "../../../src/domains/options/options.resolve.js";
import { SITE_URL_ERROR_MESSAGE } from "../../../src/domains/options/site-url.schema.js";
import { type LoadModule, main } from "../../../src/index.js";

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

const validLoader: LoadModule = async () => ({
  siteIndexes: [],
});

const invalidOptionsCases: InvalidOptionsCase[] = [
  {
    name: "invalid siteUrl",
    input: { siteUrl: "not-a-url", rootPath: "/repo" },
    message: "Invalid URL",
  },
  {
    name: "siteUrl with non-http protocol",
    input: { siteUrl: "ftp://cloudini.org", rootPath: "/repo" },
    message: "Invalid URL",
  },
  {
    name: "siteUrl with path",
    input: { siteUrl: "https://cloudini.org/path", rootPath: "/repo" },
    message: SITE_URL_ERROR_MESSAGE,
  },
  {
    name: "siteUrl with query",
    input: {
      siteUrl: "https://cloudini.org?preview=true",
      rootPath: "/repo",
    },
    message: SITE_URL_ERROR_MESSAGE,
  },
  {
    name: "siteUrl with hash",
    input: { siteUrl: "https://cloudini.org#section", rootPath: "/repo" },
    message: SITE_URL_ERROR_MESSAGE,
  },
  {
    name: "blank rootPath",
    input: { siteUrl: "https://example.com", rootPath: " ".repeat(3) },
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

describe("resolveOptions rejections", () => {
  it.each(invalidOptionsCases)(
    "rejects invalid options: $name",
    ({ input, message }) => {
      const options = {
        ...input,
        loadModule: "loadModule" in input ? input.loadModule : validLoader,
      } as Parameters<typeof resolveOptions>[0];

      expect(() => resolveOptions(options)).toThrow(message);
    },
  );

  it("rejects non-string siteUrl values", () => {
    expect(() =>
      resolveOptions({
        siteUrl: 42 as unknown as string,
        rootPath: "/repo",
        loadModule: validLoader,
      }),
    ).toThrow("Invalid input");
  });
});

describe("main option validation", () => {
  it.each(invalidOptionsCases)(
    "fails fast for invalid options before loading modules: $name",
    async ({ input, message }) => {
      const loadModule = vi.fn<LoadModule>(async () => ({
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
