import path from "node:path";
import { glob } from "tinyglobby";
import type { Module } from "./types.js";

const IGNORED_PATHS = [
  "**/node_modules/**",
  "**/dist/**",
  "**/coverage/**",
  "**/.git/**",
];

function makeModule(root: string, filePath: string): Module {
  const relativePath = path.relative(root, filePath);
  const posixPath = relativePath.split(path.sep).join("/");

  return {
    filePath,
    importId: `./${posixPath}`,
  };
}

export async function discoverModules(
  root: string,
  supportedExtensions: string[],
): Promise<Module[]> {
  const filePaths = await glob(
    supportedExtensions.map((extension) => `**/*.site-index${extension}`),
    {
      cwd: root,
      absolute: true,
      onlyFiles: true,
      dot: false,
      ignore: IGNORED_PATHS,
    },
  );

  filePaths.sort((a, b) => a.localeCompare(b));

  return filePaths.map((filePath) => makeModule(root, filePath));
}
