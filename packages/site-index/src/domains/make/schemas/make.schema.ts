import NodePath from "node:path";
import { z as Zod } from "zod";
import { isRelativePathEscapingRoot } from "../../../shared/utils/path.js";
import { type Format, FORMATS, type MakeConfig } from "../types.js";

const EXTENSIONS: Record<Format, string> = {
  ts: "ts",
  esm: "mjs",
};

const EXT_PATTERN = Object.values(EXTENSIONS).join("|");

function isWithinCurrentWorkingDirectory(filePath: string): boolean {
  const cwd = process.cwd();
  const resolved = NodePath.resolve(filePath);
  const relative = NodePath.relative(cwd, resolved);

  return relative !== "" && !isRelativePathEscapingRoot(relative);
}

function normalizeBaseName(filePath: string): string {
  const name = NodePath.basename(filePath);

  return name
    .replace(new RegExp(String.raw`\.site-index\.(${EXT_PATTERN})$`), "")
    .replace(new RegExp(String.raw`\.(${EXT_PATTERN})$`), "");
}

const MakeOptionsSchema = Zod.object({
  filePath: Zod.string()
    .trim()
    .min(1, { error: "File path is required" })
    .refine(isWithinCurrentWorkingDirectory, {
      error: "File path must stay within the current working directory",
    }),
  format: Zod.enum(FORMATS, {
    error: "Invalid option: --format must be one of: ts, esm",
  }).default("ts"),
  force: Zod.boolean().default(false),
});

export const MakeConfigSchema = MakeOptionsSchema.transform(
  (options): MakeConfig => {
    const resolved = NodePath.resolve(options.filePath);
    const dir = NodePath.dirname(resolved);
    const base = normalizeBaseName(resolved);
    const ext = EXTENSIONS[options.format];

    return {
      ...options,
      outputFilePath: NodePath.resolve(dir, `${base}.site-index.${ext}`),
    };
  },
);
