// @ts-check
import js from "@eslint/js";
import eslintPluginAstro from "eslint-plugin-astro";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  // Global ignores
  {
    ignores: ["dist/**", "node_modules/**", ".astro/**"],
  },

  // Base JS recommended rules for all files
  js.configs.recommended,

  // Astro recommended (covers .astro files with embedded scripts)
  ...eslintPluginAstro.configs.recommended,

  // TypeScript files — TS compiler handles undef/type errors; we add lint rules only
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // Extend TS recommended over base JS rules
      ...tsPlugin.configs.recommended.rules,
      // TS compiler already handles no-undef; disable noisy JS rule for TS
      "no-undef": "off",

      // Explicit extras
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // Shared rules for .js, .ts, and .astro
  {
    files: ["**/*.{js,ts,astro}"],
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
    },
  },
];
