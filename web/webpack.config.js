const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const appDirectory = path.resolve(__dirname, '..')

const babelConfig = require('./babel.config')

const {getPorts} = require('../dev/ports')
const indexHtmlPath = path.resolve(appDirectory, 'web/index.html')
const indexJsPath = path.resolve(appDirectory, 'web/index.web.js')

const babelLoaderConfiguration = {
  test: /\.[jt]sx?$/,
  include: [
    indexJsPath,
    path.resolve(appDirectory, 'src'),
    path.resolve(appDirectory, 'node_modules/react-native-vector-icons'),
  ],
  exclude: [
    {
      and: [
        path.resolve(appDirectory, 'node_modules'),
        path.resolve(appDirectory, 'android'),
        path.resolve(appDirectory, 'ios'),
      ],
      not: [],
    },
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      presets: ['module:@react-native/babel-preset'],
      plugins: ['react-native-web', ...(babelConfig.plugins || [])],
    },
  },
}

const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png|svg)$/i,
  type: 'asset', // webpack 5-friendly; replaces url-loader/file-loader
}

const ttfLoaderConfiguration = {
  test: /\.ttf$/i,
  type: 'asset/resource',
}

const {webPort} = getPorts(path.resolve(__dirname, '..'))
module.exports = {
  entry: {app: indexJsPath},
  output: {
    clean: true,
    path: path.resolve(appDirectory, 'dist'),
    filename: 'app.bundle.js',
  },
  resolve: {
    extensions: [
      '.web.tsx', '.web.ts', '.web.jsx', '.web.js',
      '.tsx', '.ts', '.jsx', '.js', '.json',
    ],
    alias: {
      'react-native$': 'react-native-web',
      '../Utilities/Platform': 'react-native-web/dist/exports/Platform',
      '../../Utilities/Platform': 'react-native-web/dist/exports/Platform',
      './Platform': 'react-native-web/dist/exports/Platform',
    },
  fallback: {
    process: require.resolve('process/browser'),
  },
  },
  module: {
    rules: [
      babelLoaderConfiguration,
      imageLoaderConfiguration,
      ttfLoaderConfiguration,
    ],
  },
    plugins: [
      new HtmlWebpackPlugin({ template: indexHtmlPath }),
      new webpack.HotModuleReplacementPlugin(),
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(true),
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
    ],
  devServer: {
    port: webPort,
    open: false,
    hot: true,
    compress: true,
    allowedHosts: 'all',
  },
}
