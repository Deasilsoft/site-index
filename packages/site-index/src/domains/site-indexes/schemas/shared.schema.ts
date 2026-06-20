import NodePath from "node:path";
import { SiteUrlSchema } from "@site-index/core";
import { z as Zod } from "zod";
import { isRelativePathEscapingRoot } from "../../../shared/utils/path.js";
import type { BaseConfig } from "../types.js";

export function isPathWithinRoot(rootPath: string, filePath: string): boolean {
  const resolvedRoot = NodePath.resolve(rootPath);
  const resolvedPath = NodePath.resolve(resolvedRoot, filePath);
  const relativePath = NodePath.relative(resolvedRoot, resolvedPath);

  return !isRelativePathEscapingRoot(relativePath);
}

export const BaseOptionsSchema = Zod.object({
  siteUrl: Zod.string({ error: "Missing required option: --site-url <url>" })
    .trim()
    .min(1, { error: "Missing required option: --site-url <url>" })
    .pipe(SiteUrlSchema),
  root: Zod.string().trim().min(1).optional(),
  config: Zod.string().trim().min(1).optional(),
}).superRefine((options, context) => {
  if (!options.config) {
    return;
  }

  const rootPath = NodePath.resolve(options.root ?? process.cwd());

  if (!isPathWithinRoot(rootPath, options.config)) {
    context.addIssue({
      code: "custom",
      path: ["config"],
      message: "Invalid option: --config must resolve within --root",
    });
  }
});

type BaseOptions = Zod.output<typeof BaseOptionsSchema>;

export function resolveBaseConfig(options: BaseOptions): BaseConfig {
  const rootPath = NodePath.resolve(options.root ?? process.cwd());

  if (options.config) {
    return {
      siteUrl: options.siteUrl,
      rootPath,
      configFile: NodePath.resolve(rootPath, options.config),
    };
  }

  return {
    siteUrl: options.siteUrl,
    rootPath,
  };
}
