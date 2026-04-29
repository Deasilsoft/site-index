import type { Artifact } from "@site-index/core";
import { createRuntimeService } from "@site-index/vite-runtime";
import NodeFS from "node:fs/promises";
import NodePath from "node:path";
import type * as Vite from "vite";
import { logger } from "../../shared/services/logger.service.js";
import type { BuildConfig } from "./types.js";

function makeResolvedViteConfig(config: BuildConfig): Vite.ResolvedConfig {
  return {
    root: config.rootPath,
    mode: "production",
    configFile: config.configFile ?? false,
  } as Vite.ResolvedConfig;
}

async function writeArtifacts(outPath: string, artifacts: Artifact[]) {
  const resolvedOutPath = NodePath.resolve(outPath);

  for (const artifact of artifacts) {
    const relativePath = artifact.filePath.replace(/^[/\\]+/, "");
    const filePath = NodePath.resolve(resolvedOutPath, relativePath);
    const relative = NodePath.relative(resolvedOutPath, filePath);

    if (relative.startsWith("..") || NodePath.isAbsolute(relative)) {
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

    for (const warning of result.warnings) {
      logger.warn(warning);
    }

    await writeArtifacts(config.outPath, result.data);
  } finally {
    await runtime.close();
  }
}
