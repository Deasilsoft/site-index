import { describe, expect, it } from "vitest";
import { BuildConfigSchema } from "../src/domains/site-indexes/schemas/build.schema.js";
import { CheckConfigSchema } from "../src/domains/site-indexes/schemas/check.schema.js";
import { withProject } from "./helpers/project.js";

const schemaParsers = [
  ["build", BuildConfigSchema.parse.bind(BuildConfigSchema)],
  ["check", CheckConfigSchema.parse.bind(CheckConfigSchema)],
] as const;

const validSiteUrls = [
  ["https://cloudini.org", "https://cloudini.org"],
  ["https://cloudini.org/", "https://cloudini.org"],
  ["  https://cloudini.org/  ", "https://cloudini.org"],
  ["http://localhost:5173", "http://localhost:5173"],
  ["http://127.0.0.1:5173", "http://127.0.0.1:5173"],
] as const;

describe("Shared schema", () => {
  it.each(schemaParsers)(
    "accepts HTTP(S) origin site-url values for %s",
    async (_, parse) => {
      await withProject({}, async (project) => {
        for (const [siteUrl, expectedSiteUrl] of validSiteUrls) {
          const config = parse({
            siteUrl,
            root: project.root,
          });

          expect(config.siteUrl).toBe(expectedSiteUrl);
        }
      });
    },
  );
});
