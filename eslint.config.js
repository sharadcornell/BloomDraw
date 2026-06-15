// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // Generated output, native dirs, and Deno-based Supabase functions are not
    // linted by the app ESLint config (Supabase functions get their own setup later).
    ignores: ["dist/*", ".expo/*", "ios/*", "android/*", "supabase/functions/**"],
  },
  {
    // Jest globals + jest-mock patterns for test files.
    files: ["**/*.test.ts", "**/*.test.tsx", "**/__tests__/**"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        jest: "readonly",
      },
    },
    rules: {
      // `jest.mock(...)` is hoisted above imports and its factory uses require().
      "import/first": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);
