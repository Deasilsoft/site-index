import { describe, expect, it } from "vitest";
import {
  assertNoDuplicateURLs,
  assertValidSiteIndexURL,
  assertValidSitemapName,
} from "./validate.js";

describe("assertValidSiteIndexURL edge cases", () => {
  it.each([
    ["about", "Invalid url: about"],
    ["/about?x=1", "Invalid url (no query/fragment): /about?x=1"],
    ["/about#team", "Invalid url (no query/fragment): /about#team"],
  ])("rejects %s", (value, expectedMessage) => {
    expect(() => assertValidSiteIndexURL(value as `/${string}`)).toThrow(
      expectedMessage,
    );
  });
});

describe("assertNoDuplicateURLs edge cases", () => {
  it("rejects duplicate urls", () => {
    expect(() =>
      assertNoDuplicateURLs([
        { url: "/about", sitemap: "pages", index: true },
        { url: "/about", sitemap: "blog", index: true },
      ]),
    ).toThrow("Duplicate url: /about");
  });
});

describe("assertValidSitemapName edge cases", () => {
  it.each(["Pages", "blog_posts", "-pages", "pages-"])("rejects %s", (name) => {
    expect(() => assertValidSitemapName(name)).toThrow(
      `Invalid sitemap name: ${name}`,
    );
  });
});
