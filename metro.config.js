console.log('Loading metro.config.js...');
const path = require('path');
const { getDefaultConfig } = require('@react-native/metro-config');
const { getPorts } = require('./dev/ports');

module.exports = (async () => {
  const { metroPort } = getPorts(__dirname);
  const config = await getDefaultConfig(__dirname);
  config.server = {
    ...config.server,
    port: metroPort,
   };
   config.watchFolders = [
    path.resolve(__dirname, 'src'),
   ];
  return config;
})();
