import { z as Zod } from "zod";
import type { SiteIndex } from "./types.js";

const LastModifiedSchema = Zod.union([
  Zod.iso.date(),
  Zod.iso.datetime({ offset: true }),
]);

export const SiteIndexSchema = Zod.strictObject({
  url: Zod.string()
    .regex(
      /^\/[^?#]*$/,
      "Invalid url (must start with '/' and not contain query/fragment)",
    )
    .transform((path) => path as SiteIndex["url"]),
  lastModified: LastModifiedSchema.optional(),
  sitemap: Zod.string()
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Invalid sitemap name (must be lowercase and can include hyphens)",
    )
    .default("pages"),
  index: Zod.boolean().default(true),
});

export type ResolvedSiteIndex = Zod.infer<typeof SiteIndexSchema>;
