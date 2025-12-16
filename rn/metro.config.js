console.log('Loading metro.config.js...')

const path = require('node:path')

const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config')
const {FileStore} = require('metro-cache')

const repoRoot = path.resolve(__dirname, '..')
const rnRoot = path.resolve(repoRoot, 'rn')

const {getPorts} = require(path.join(repoRoot, 'rn/dev/ports'))
const {metroPort} = getPorts(repoRoot)

const defaultConfig = getDefaultConfig(rnRoot)

module.exports = mergeConfig(defaultConfig, {
  projectRoot: rnRoot,
  watchFolders: [repoRoot],
  server: {port: metroPort},
  resolver: {
    nodeModulesPaths: [path.join(repoRoot, 'node_modules')],
    disableHierarchicalLookup: true,
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === '@babel/runtime' || moduleName.startsWith('@babel/runtime/')) {
        return context.resolveRequest(
          {
            ...context,
            unstable_enablePackageExports: false,
            unstable_conditionNames: ['require'],
          },
          moduleName,
          platform,
        )
      }
      return context.resolveRequest(context, moduleName, platform)
    },
  },
  cacheStores: [
    new FileStore({
      root: path.join(repoRoot, '.cache/metro'),
    }),
  ],
})
