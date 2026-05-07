import type { Artifact } from "@site-index/core";
import { createRuntimeService } from "@site-index/vite-runtime";
import NodeFS from "node:fs/promises";
import NodePath from "node:path";
import { logger } from "../../shared/logging/logger.js";
import type { BuildConfig } from "./types.js";
import { makeResolvedViteConfig } from "./vite.config.js";

async function writeArtifacts(outPath: string, artifacts: Artifact[]) {
  const resolvedOutPath = NodePath.resolve(outPath);

  for (const artifact of artifacts) {
    const filePath = NodePath.resolve(resolvedOutPath, artifact.filePath);
    const relativePath = NodePath.relative(resolvedOutPath, filePath);

    if (relativePath.startsWith("..") || NodePath.isAbsolute(relativePath)) {
      throw new Error(
        `Artifact path escapes output directory: ${artifact.filePath}`,
      );
    }

    await NodeFS.mkdir(NodePath.dirname(filePath), { recursive: true });
    await NodeFS.writeFile(filePath, artifact.content, "utf8");
  }
}

export async function runBuild(config: BuildConfig): Promise<void> {
  const runtime = createRuntimeService()
    .withOptions({
      siteUrl: config.siteUrl,
      extensions: undefined,
    })
    .withViteConfig(makeResolvedViteConfig(config))
    .build();

  try {
    const result = await runtime.buildArtifacts();

    logger.warn(result.warnings);

    await writeArtifacts(config.outPath, result.data);
  } finally {
    await runtime.close();
  }
}
