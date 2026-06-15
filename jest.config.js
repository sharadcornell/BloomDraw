/** Jest config for BloomDraw. Uses jest-expo so RN/Expo modules transform correctly. */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts?(x)', '**/?(*.)+(test).ts?(x)'],
};
