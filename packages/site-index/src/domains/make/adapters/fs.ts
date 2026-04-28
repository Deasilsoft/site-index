import NodeFS from "node:fs/promises";

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await NodeFS.access(filePath);
    return true;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return false;
    }

    throw error;
  }
}
