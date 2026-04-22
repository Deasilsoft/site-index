import type { Artifact } from "../../src/index.js";

export function artifactMap(artifacts: Artifact[]): Map<string, string> {
  return new Map(
    artifacts.map((artifact) => [artifact.filePath, artifact.content] as const),
  );
}
