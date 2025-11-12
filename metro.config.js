console.log('Loading metro.config.js...');
const { getDefaultConfig } = require('@react-native/metro-config');
const { getPorts } = require('./scripts/ports');

module.exports = (async () => {
  const { metroPort } = getPorts(__dirname);

  const config = await getDefaultConfig(__dirname);
  config.server = { ...config.server, port: metroPort };
  return config;
})();
