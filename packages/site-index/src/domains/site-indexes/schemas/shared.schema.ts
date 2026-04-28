import NodePath from "node:path";
import { z as Zod } from "zod";
import type { BaseConfig } from "../types.js";

const INVALID_CONFIG_PATH_ERROR =
  "Invalid option: --config must resolve within --root";

export function isPathWithinRoot(rootPath: string, filePath: string): boolean {
  const resolvedRoot = NodePath.resolve(rootPath);
  const resolvedPath = NodePath.resolve(resolvedRoot, filePath);
  const relativePath = NodePath.relative(resolvedRoot, resolvedPath);

  return (
    relativePath !== "" &&
    !relativePath.startsWith("..") &&
    !NodePath.isAbsolute(relativePath)
  );
}

export const BaseOptionsSchema = Zod.object({
  siteUrl: Zod.string({ error: "Missing required option: --site-url <url>" })
    .trim()
    .min(1, { error: "Missing required option: --site-url <url>" })
    .pipe(
      Zod.url({
        error: "Invalid option: --site-url must be a valid URL",
      }),
    ),
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
      message: INVALID_CONFIG_PATH_ERROR,
    });
  }
});

type BaseOptions = Zod.output<typeof BaseOptionsSchema>;

export function resolveBaseConfig(options: BaseOptions): BaseConfig {
  const rootPath = NodePath.resolve(options.root ?? process.cwd());

  return {
    siteUrl: options.siteUrl,
    rootPath,
    ...(options.config
      ? { configFile: NodePath.resolve(rootPath, options.config) }
      : {}),
  };
}
