import NodePath from "node:path";
import { SITE_URL_ERROR_MESSAGE } from "@site-index/core";
import { describe, expect, it } from "vitest";
import { BuildConfigSchema } from "../src/domains/site-indexes/schemas/build.schema.js";
import { CheckConfigSchema } from "../src/domains/site-indexes/schemas/check.schema.js";
import { withProject } from "./helpers/project.js";

const schemaParsers = [
  ["build", BuildConfigSchema.parse.bind(BuildConfigSchema)],
  ["check", CheckConfigSchema.parse.bind(CheckConfigSchema)],
] as const;

const invalidSiteUrls = [
  ["ftp://cloudini.org", "Invalid URL"],
  ["https://cloudini.org/path", SITE_URL_ERROR_MESSAGE],
  ["https://cloudini.org?preview=true", SITE_URL_ERROR_MESSAGE],
  ["https://cloudini.org#section", SITE_URL_ERROR_MESSAGE],
  ["not-a-url", "Invalid URL"],
] as const;

describe("Shared schema rejections", () => {
  it.each(schemaParsers)(
    "rejects missing site-url for %s",
    async (_, parse) => {
      await withProject({}, async (project) => {
        project.chdir();
        expect(() => parse({ root: project.root })).toThrow(
          "Missing required option: --site-url <url>",
        );
      });
    },
  );

  it.each(schemaParsers)(
    "rejects invalid site-url values for %s",
    async (_, parse) => {
      await withProject({}, async (project) => {
        for (const [siteUrl, message] of invalidSiteUrls) {
          expect(() =>
            parse({
              siteUrl,
              root: project.root,
            }),
          ).toThrow(message);
        }
      });
    },
  );

  it.each(schemaParsers)(
    "rejects config paths that escape root for %s",
    async (_, parse) => {
      await withProject({}, async (project) => {
        expect(() =>
          parse({
            siteUrl: "https://example.com",
            root: project.root,
            config: "../vite.config.ts",
          }),
        ).toThrow("Invalid option: --config must resolve within --root");
      });
    },
  );

  it.each(schemaParsers)(
    "rejects absolute config paths outside root for %s",
    async (_, parse) => {
      await withProject({}, async (project) => {
        expect(() =>
          parse({
            siteUrl: "https://example.com",
            root: project.root,
            config: NodePath.resolve(project.root, "..", "vite.config.ts"),
          }),
        ).toThrow("Invalid option: --config must resolve within --root");
      });
    },
  );

  it.each(schemaParsers)(
    "rejects config paths that escape the current directory when --root is omitted for %s",
    async (_, parse) => {
      await withProject({}, async (project) => {
        project.chdir();

        expect(() =>
          parse({
            siteUrl: "https://example.com",
            config: "../vite.config.ts",
          }),
        ).toThrow("Invalid option: --config must resolve within --root");
      });
    },
  );
});
