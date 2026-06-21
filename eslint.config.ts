import js from "@eslint/js";
import unicorn from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  unicorn.configs.recommended,
  {
    rules: {
      "unicorn/name-replacements": "off",
      "unicorn/no-this-outside-of-class": "off",
      "unicorn/prefer-spread": "off",
      "unicorn/prefer-ternary": "off",
      "unicorn/prevent-abbreviations": "off",
    },
  },
  {
    files: ["packages/**/test/**/*.ts"],
    rules: {
      "unicorn/no-top-level-side-effects": "off",
    },
  },
  {
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: "error",
    },
  },
  {
    ignores: ["**/dist", "**/coverage"],
  },
];
