import NodeFS from "node:fs/promises";
import NodePath from "node:path";
import { fileURLToPath } from "node:url";
import type { Format, ScaffoldFailure } from "../types.js";
import { renderTemplate } from "./handlebars.js";

type TemplateData = {
  filePath: string;
  format: Format;
  lastModified: string;
};

const DIR = NodePath.dirname(fileURLToPath(import.meta.url));

const TEMPLATES: Record<Format, string> = {
  esm: NodePath.resolve(DIR, "../templates/site-index.esm.hbs"),
  ts: NodePath.resolve(DIR, "../templates/site-index.ts.hbs"),
};

export async function scaffoldSiteIndexModule(
  data: TemplateData,
): Promise<{ failures: ScaffoldFailure[] }> {
  try {
    const templatePath = TEMPLATES[data.format];
    const template = await NodeFS.readFile(templatePath, "utf8");
    const content = renderTemplate(template, {
      lastModified: data.lastModified,
    });

    await NodeFS.mkdir(NodePath.dirname(data.filePath), { recursive: true });
    await NodeFS.writeFile(data.filePath, content, "utf8");

    return { failures: [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return {
      failures: [
        {
          path: data.filePath,
          error: message,
          message,
        },
      ],
    };
  }
}
