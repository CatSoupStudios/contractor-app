module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Tiene que ser el último
      'react-native-reanimated/plugin',
    ],
  };
};
