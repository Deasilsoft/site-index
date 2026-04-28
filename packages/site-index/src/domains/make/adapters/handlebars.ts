export type TemplateContext = Record<string, string>;

const TOKEN_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*}}/g;

export function renderTemplate(
  template: string,
  context: TemplateContext,
): string {
  return template.replace(TOKEN_PATTERN, (token, variableName: string) => {
    return context[variableName] ?? token;
  });
}
