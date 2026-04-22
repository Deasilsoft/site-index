import { z } from "zod";
import type { Result, Warning } from "../../shared/types.js";
import type { LoadedModule, ResolvedModule, SiteIndex } from "./types.js";

const URL_PATH_REGEX = /^\/[^?#]*$/;
const SITEMAP_NAME_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function asUrlPath(path: string): `/${string}` {
  return path as `/${string}`;
}

const SiteIndexSchema = z.strictObject({
  url: z
    .string()
    .regex(
      URL_PATH_REGEX,
      "Invalid url (must start with '/' and not contain query/fragment)",
    )
    .transform(asUrlPath),
  lastModified: z.string().optional(),
  sitemap: z
    .string()
    .regex(SITEMAP_NAME_REGEX, "Invalid sitemap name")
    .optional(),
  index: z.boolean().optional(),
});

const ModuleExportsSchema = z.strictObject({
  default: z.array(SiteIndexSchema),
});

type ParsedSiteIndex = z.output<typeof SiteIndexSchema>;

function toSiteIndex(siteIndex: ParsedSiteIndex): SiteIndex {
  const normalized: SiteIndex = {
    url: siteIndex.url,
  };

  if (siteIndex.lastModified !== undefined) {
    normalized.lastModified = siteIndex.lastModified;
  }

  if (siteIndex.sitemap !== undefined) {
    normalized.sitemap = siteIndex.sitemap;
  }

  if (siteIndex.index !== undefined) {
    normalized.index = siteIndex.index;
  }

  return normalized;
}

function parseSiteIndexes(loadedModule: LoadedModule): Result<SiteIndex[]> {
  const parsedExports = ModuleExportsSchema.safeParse(
    loadedModule.defaultExport,
  );

  if (!parsedExports.success) {
    return {
      data: [],
      warnings: [
        {
          message: `Invalid site index module exports: ${parsedExports.error.message}`,
          filePath: loadedModule.module.filePath,
        },
      ],
    };
  }

  return {
    data: parsedExports.data.default.map(toSiteIndex),
    warnings: [],
  };
}

function resolveModule(
  loadedModule: LoadedModule,
): Result<ResolvedModule | null> {
  const parsed = parseSiteIndexes(loadedModule);

  if (parsed.data.length === 0 && parsed.warnings.length > 0) {
    return {
      data: null,
      warnings: parsed.warnings,
    };
  }

  return {
    data: {
      module: loadedModule.module,
      siteIndexes: parsed.data,
    },
    warnings: parsed.warnings,
  };
}

export function validateModules(
  loadedModules: LoadedModule[],
): Result<ResolvedModule[]> {
  const data: ResolvedModule[] = [];
  const warnings: Warning[] = [];

  for (const loadedModule of loadedModules) {
    const resolved = resolveModule(loadedModule);

    if (resolved.data) {
      data.push(resolved.data);
    }

    warnings.push(...resolved.warnings);
  }

  return { data, warnings };
}
