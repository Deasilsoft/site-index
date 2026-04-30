import js from "@eslint/js";
import unicorn from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  unicorn.configs.recommended,
  {
    rules: {
      "unicorn/prevent-abbreviations": "off",
      "unicorn/prefer-ternary": "off",
    },
  },
  {
    ignores: ["**/dist", "**/coverage"],
  },
];
