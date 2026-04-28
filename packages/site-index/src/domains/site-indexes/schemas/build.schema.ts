import NodePath from "node:path";
import { z as Zod } from "zod";
import { type BuildConfig } from "../types.js";
import {
  BaseOptionsSchema,
  isPathWithinRoot,
  resolveBaseConfig,
} from "./shared.schema.js";

const INVALID_OUT_PATH_ERROR =
  "Invalid option: --out must resolve within --root";

const BuildOptionsSchema = BaseOptionsSchema.extend({
  out: Zod.string().trim().min(1).default("dist"),
}).superRefine((options, context) => {
  const rootPath = NodePath.resolve(options.root ?? process.cwd());

  if (!isPathWithinRoot(rootPath, options.out)) {
    context.addIssue({
      code: "custom",
      path: ["out"],
      message: INVALID_OUT_PATH_ERROR,
    });
  }
});

export const BuildConfigSchema = BuildOptionsSchema.transform(
  ({ out, ...options }): BuildConfig => {
    const baseConfig = resolveBaseConfig(options);

    return {
      ...baseConfig,
      outPath: NodePath.resolve(baseConfig.rootPath, out),
    };
  },
);
