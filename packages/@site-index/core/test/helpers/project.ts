import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export async function createTempProject(tempRoots: string[]): Promise<string> {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), "site-index-main-test-"),
  );
  tempRoots.push(root);
  return root;
}

export async function cleanupTempProjects(tempRoots: string[]): Promise<void> {
  await Promise.all(
    tempRoots.splice(0, tempRoots.length).map(async (root) => {
      await fs.rm(root, { recursive: true, force: true });
    }),
  );
}
