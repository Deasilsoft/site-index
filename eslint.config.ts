import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: ["coverage", "dist", "node_modules"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: false,
      },
    },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["..", "../**"],
              message: 'Use the "@/" alias instead of parent-relative imports.',
            },
            {
              regex: "^\\./(?:(?!\\.js$).)+$",
              message:
                "Use explicit .js extensions for relative imports/exports.",
            },
            {
              regex: "^\\.\\./(?:(?!\\.js$).)+$",
              message:
                "Use explicit .js extensions for relative imports/exports.",
            },
          ],
        },
      ],
      "no-console": "off",
    },
  },
);
