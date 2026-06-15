// Explicit Babel config so Jest (babel-jest via jest-expo) transforms the app
// the same way Metro does. babel-preset-expo is the preset Metro already uses,
// so this does not change app/Metro behavior (it auto-includes the Reanimated /
// worklets plugin and React Compiler per app.json experiments).
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
