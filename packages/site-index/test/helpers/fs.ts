import fs from "node:fs/promises";
import path from "node:path";

export async function writeFiles(
  root: string,
  relativePaths: string[],
): Promise<void> {
  await Promise.all(
    relativePaths.map(async (relativePath) => {
      const filePath = path.join(root, relativePath);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, "// test file\n", "utf8");
    }),
  );
}
