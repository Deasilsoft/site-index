import { chmod } from "node:fs/promises";
import NodePath from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = NodePath.dirname(fileURLToPath(import.meta.url));
const packageRoot = NodePath.resolve(scriptDir, "..");
const binPath = NodePath.resolve(packageRoot, "dist/bin.js");

await chmod(binPath, 0o755);
