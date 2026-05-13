import { BaseOptionsSchema, resolveBaseConfig } from "./shared.schema.js";

export const CheckConfigSchema = BaseOptionsSchema.transform((options) =>
  resolveBaseConfig(options),
);
