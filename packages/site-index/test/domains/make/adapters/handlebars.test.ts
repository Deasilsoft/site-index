import { describe, expect, it } from "vitest";
import { renderTemplate } from "../../../../src/domains/make/adapters/handlebars.js";

describe("renderTemplate", () => {
  it("preserves unknown tokens while replacing known variables", () => {
    const rendered = renderTemplate("before {{known}} and {{unknown}}", {
      known: "after",
    });

    expect(rendered).toBe("before after and {{unknown}}");
  });
});
