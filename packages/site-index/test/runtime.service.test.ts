import NodeFS from "node:fs/promises";
import NodePath from "node:path";
import { describe, expect, it } from "vitest";
import { runRuntime } from "../src/domains/site-indexes/runtime.service.js";
import { withProject } from "./helpers/project.js";

describe("runtime service", () => {
  it("loads runtime module and forwards site-url/out arguments", async () => {
    await withProject(
      {
        "dist/server/site-index.runtime.mjs": `
          import NodeFS from "node:fs/promises";
          import NodePath from "node:path";

          export async function run(args) {
            await NodeFS.mkdir(args[3], { recursive: true });
            await NodeFS.writeFile(NodePath.join(args[3], "captured.json"), JSON.stringify(args), "utf8");
          }
        `,
      },
      async (project) => {
        await runRuntime({
          siteUrl: "https://example.com",
          rootPath: project.root,
          entryPath: project.path("dist/server/site-index.runtime.mjs"),
          outPath: project.path("public"),
        });

        const args = JSON.parse(
          await NodeFS.readFile(project.path("public/captured.json"), "utf8"),
        ) as string[];

        expect(args).toEqual([
          "--site-url",
          "https://example.com",
          "--out",
          NodePath.resolve(project.root, "public"),
        ]);
      },
    );
  });

  it("rejects runtime module without run(args) export", async () => {
    await withProject(
      {
        "dist/server/site-index.runtime.mjs": "export const value = 1;",
      },
      async (project) => {
        await expect(
          runRuntime({
            siteUrl: "https://example.com",
            rootPath: project.root,
            entryPath: project.path("dist/server/site-index.runtime.mjs"),
            outPath: project.path("public"),
          }),
        ).rejects.toThrow("expected export 'run(args)'");
      },
    );
  });
});
