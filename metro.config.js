console.log('Loading metro.config.js...')
const path = require('node:path')
const {getDefaultConfig} = require('@react-native/metro-config')
const {FileStore} = require('metro-cache')
const {getPorts} = require('./dev/ports')

module.exports = (async () => {
  const {metroPort} = getPorts(__dirname)
  const config = await getDefaultConfig(__dirname)
  config.server = {
    ...config.server,
    port: metroPort,
  }
  config.watchFolders = [
    path.resolve(__dirname, 'src'),
  ]
  config.cacheStores = [
    new FileStore({
      root: path.join(__dirname, 'node_modules/.cache/metro'),
    }),
  ]
  return config
})()
