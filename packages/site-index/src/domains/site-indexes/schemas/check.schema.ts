import { z as Zod } from "zod";
import { BaseOptionsSchema, resolveBaseConfig } from "./shared.schema.js";

export const CheckConfigSchema = BaseOptionsSchema.transform((options) =>
  resolveBaseConfig(options),
);

export type CheckConfig = Zod.output<typeof CheckConfigSchema>;
