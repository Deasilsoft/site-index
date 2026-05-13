import NodePath from "node:path";

export function isRelativePathEscapingRoot(relativePath: string): boolean {
  return (
    relativePath === ".." ||
    relativePath.startsWith(`..${NodePath.sep}`) ||
    NodePath.isAbsolute(relativePath)
  );
}
