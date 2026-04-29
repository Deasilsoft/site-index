import { cp, mkdir, readdir } from "node:fs/promises";
import NodePath from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = NodePath.dirname(fileURLToPath(import.meta.url));
const packageRoot = NodePath.resolve(scriptDir, "..");
const templatesSrcDir = NodePath.resolve(
  packageRoot,
  "src/domains/make/templates",
);
const templatesDistDir = NodePath.resolve(
  packageRoot,
  "dist/domains/make/templates",
);

await mkdir(templatesDistDir, { recursive: true });

for (const name of await readdir(templatesSrcDir)) {
  await cp(
    NodePath.join(templatesSrcDir, name),
    NodePath.join(templatesDistDir, name),
    {
      recursive: true,
      force: true,
    },
  );
}
