/** Jest config for BloomDraw. Uses jest-expo so RN/Expo modules transform correctly. */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Edge Function (_shared) modules use explicit `.ts` extensions in relative
    // imports because Deno REQUIRES them. Strip the extension so Jest's Node
    // resolver finds the file (Deno keeps the original specifier — unaffected).
    '^(\\.{1,2}/.*)\\.ts$': '$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/?(*.)+(test).ts?(x)'],
};
