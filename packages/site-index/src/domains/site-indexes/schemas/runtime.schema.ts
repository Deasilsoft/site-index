import NodePath from "node:path";
import { SiteUrlSchema } from "@site-index/core";
import { z as Zod } from "zod";
import type { RuntimeConfig } from "../types.js";
import { isPathWithinRoot } from "./shared.schema.js";

const RuntimeOptionsSchema = Zod.object({
  siteUrl: Zod.string()
    .trim()
    .min(1, { error: "Missing required option: --site-url <url>" })
    .pipe(SiteUrlSchema),
  root: Zod.string().trim().min(1).optional(),
  out: Zod.string().trim().min(1).default("dist"),
  entry: Zod.string().trim().min(1).default("dist/server/site-index.runtime.mjs"),
}).superRefine((options, context) => {
  const rootPath = NodePath.resolve(options.root ?? process.cwd());

  if (!isPathWithinRoot(rootPath, options.out)) {
    context.addIssue({
      code: "custom",
      path: ["out"],
      message: "Invalid option: --out must resolve within --root",
    });
  }

  if (!isPathWithinRoot(rootPath, options.entry)) {
    context.addIssue({
      code: "custom",
      path: ["entry"],
      message: "Invalid option: --entry must resolve within --root",
    });
  }
});

export const RuntimeConfigSchema = RuntimeOptionsSchema.transform(
  ({ out, entry, root, siteUrl }): RuntimeConfig => {
    const rootPath = NodePath.resolve(root ?? process.cwd());

    return {
      siteUrl,
      rootPath,
      outPath: NodePath.resolve(rootPath, out),
      entryPath: NodePath.resolve(rootPath, entry),
    };
  },
);
