import { z as Zod } from "zod";
import { SiteIndexSchema } from "./site-indexes.schema.js";

export const ResolvedModuleSchema = Zod.strictObject({
  filePath: Zod.string(),
  importId: Zod.string(),
  siteIndexes: Zod.array(SiteIndexSchema),
});

export type ResolvedModule = Zod.infer<typeof ResolvedModuleSchema>;
