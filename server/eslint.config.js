const eslintPluginImport = require("eslint-plugin-import");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const prettier = require("eslint-config-prettier");

module.exports = [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint,
      import: eslintPluginImport
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...eslintPluginImport.configs.recommended.rules
    }
  },
  prettier
];
