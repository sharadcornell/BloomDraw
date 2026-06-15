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
]);
