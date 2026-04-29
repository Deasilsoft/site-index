import { rm } from "node:fs/promises";
import NodePath from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = NodePath.dirname(fileURLToPath(import.meta.url));
const packageRoot = NodePath.resolve(scriptDir, "..");

for (const name of ["dist", "coverage"]) {
  await rm(NodePath.resolve(packageRoot, name), {
    recursive: true,
    force: true,
  });
}
