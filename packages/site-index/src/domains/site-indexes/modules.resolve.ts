import type { Result, Warning } from "../../shared/types.js";
import { type ResolvedModule, ResolvedModuleSchema } from "./modules.schema.js";
import type { LoadedModule } from "./types.js";

export function resolveModules(
  modules: LoadedModule[],
): Result<ResolvedModule[]> {
  const data: ResolvedModule[] = [];
  const warnings: Warning[] = [];

  for (const module of modules) {
    const resolved = ResolvedModuleSchema.safeParse(module);

    if (!resolved.success) {
      warnings.push({
        message: `Invalid module: ${resolved.error.message}`,
        filePath: module.filePath,
      });

      continue;
    }

    data.push(resolved.data);
  }

  return { data, warnings };
}
