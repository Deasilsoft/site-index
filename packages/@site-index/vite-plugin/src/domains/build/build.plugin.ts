import type { Options as CoreOptions } from "@site-index/core";
import { Logger } from "@site-index/observability";
import NodePath from "node:path";
import type { RuntimeService } from "@site-index/vite-runtime";
import { createRuntimeService } from "@site-index/vite-runtime";
import * as Vite from "vite";
import pkg from "../../../package.json" with { type: "json" };

type Options = Pick<CoreOptions, "siteUrl" | "extensions">;
const DEFAULT_EXTENSIONS = [".js", ".mjs", ".ts"] as const;
const RUNTIME_ENTRY_ID = "virtual:site-index/runtime-entry";
const RESOLVED_RUNTIME_ENTRY_ID = "\0site-index/runtime-entry";
const RUNTIME_FILE_NAME = "site-index.runtime.mjs";

function makeRuntimeImportId(rootPath: string, filePath: string): string {
  const relativePath = NodePath.relative(rootPath, filePath);

  return `./${relativePath.split(NodePath.sep).join("/")}`;
}

function makeRuntimeSource(
  rootPath: string,
  moduleFilePaths: readonly string[],
): string {
  const imports: string[] = [];
  const modules: string[] = [];

  for (const [index, filePath] of moduleFilePaths.entries()) {
    const importName = `module${index}`;
    const normalizedFilePath = Vite.normalizePath(filePath);

    imports.push(`import ${importName} from ${JSON.stringify(normalizedFilePath)};`);
    modules.push(
      `{ filePath: ${JSON.stringify(filePath)}, importId: ${JSON.stringify(makeRuntimeImportId(rootPath, filePath))}, siteIndexes: ${importName}.siteIndexes }`,
    );
  }

  return `
import { buildArtifactsFromLoadedModules } from "@site-index/core";
import NodeFS from "node:fs/promises";
import NodePath from "node:path";
import { pathToFileURL } from "node:url";
${imports.join("\n")}

const loadedModules = [${modules.join(",")}];

function isRelativePathEscapingRoot(relativePath) {
  return relativePath.startsWith("..") || NodePath.isAbsolute(relativePath);
}

export function buildArtifacts({ siteUrl }) {
  return buildArtifactsFromLoadedModules({
    siteUrl,
    loadedModules,
  });
}

export async function writeArtifacts(outPath, artifacts) {
  const resolvedOutPath = NodePath.resolve(outPath);

  for (const artifact of artifacts) {
    const filePath = NodePath.resolve(resolvedOutPath, artifact.filePath);
    const relativePath = NodePath.relative(resolvedOutPath, filePath);

    if (isRelativePathEscapingRoot(relativePath)) {
      throw new Error(\`Artifact path escapes output directory: \${artifact.filePath}\`);
    }

    await NodeFS.mkdir(NodePath.dirname(filePath), { recursive: true });
    await NodeFS.writeFile(filePath, artifact.content, "utf8");
  }
}

export async function run(args = process.argv.slice(2)) {
  let siteUrl;
  let outPath;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const value = args[index + 1];

    if (argument === "--site-url") {
      siteUrl = value;
      index += 1;
      continue;
    }

    if (argument === "--out") {
      outPath = value;
      index += 1;
    }
  }

  if (!siteUrl || !outPath) {
    throw new Error("Usage: node site-index.runtime.mjs --site-url <url> --out <dir>");
  }

  const result = buildArtifacts({ siteUrl });

  if (result.warnings.length > 0) {
    for (const warning of result.warnings) {
      console.warn(\`Warning: \${warning.filePath ? \`\${warning.filePath}: \` : ""}\${warning.message}\`);
    }
  }

  await writeArtifacts(outPath, result.data);

  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await run();
}
`.trimStart();
}

export function siteIndexBuildPlugin(options: Options): Vite.Plugin {
  const logger = new Logger();
  let runtime: RuntimeService | undefined;
  let resolvedConfig: Vite.ResolvedConfig | undefined;
  let runtimeSource: string | undefined;
  let isRuntimeClosed = false;

  function getRuntime(): RuntimeService {
    if (runtime === undefined) {
      throw new Error("Vite config could not be resolved");
    }

    return runtime;
  }

  async function closeRuntime(): Promise<void> {
    if (isRuntimeClosed) {
      return;
    }

    isRuntimeClosed = true;

    await runtime?.close();
  }

  return {
    name: `${pkg.name}:build`,
    apply: "build",
    configResolved(config) {
      resolvedConfig = config;
      runtime = createRuntimeService()
        .withOptions(options)
        .withViteConfig(config)
        .build();

      logger.configure({ writer: config.logger });
    },
    async buildStart() {
      try {
        const result = await getRuntime().buildArtifacts();

        logger.warn(result.warnings);

        if (!resolvedConfig?.build?.ssr) {
          return;
        }

        const supportedExtensions = options.extensions ?? DEFAULT_EXTENSIONS;
        const moduleFilePaths = [...getRuntime().getWatchedFiles()]
          .filter((filePath) =>
            supportedExtensions.some((extension) =>
              filePath.endsWith(`.site-index${extension}`),
            ),
          )
          .toSorted((first, second) => first.localeCompare(second));

        runtimeSource = makeRuntimeSource(resolvedConfig.root, moduleFilePaths);
        this.emitFile({
          type: "chunk",
          id: RUNTIME_ENTRY_ID,
          fileName: RUNTIME_FILE_NAME,
        });
      } catch (error) {
        await closeRuntime();

        throw error;
      }
    },
    generateBundle() {
      for (const artifact of getRuntime().getArtifacts()) {
        this.emitFile({
          type: "asset",
          fileName: artifact.filePath,
          source: artifact.content,
        });
      }
    },
    resolveId(id) {
      if (id === RUNTIME_ENTRY_ID) {
        return RESOLVED_RUNTIME_ENTRY_ID;
      }
    },
    load(id) {
      if (id === RESOLVED_RUNTIME_ENTRY_ID) {
        return runtimeSource;
      }
    },
    async closeBundle() {
      await closeRuntime();
    },
  };
}
