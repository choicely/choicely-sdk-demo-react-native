const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = path.resolve(__dirname, '.');

const babelLoaderConfiguration = {
  test: /\.[jt]sx?$/,
  include: [
    path.resolve(appDirectory, 'index.web.js'),
    path.resolve(appDirectory, 'src'),
    path.resolve(appDirectory, 'node_modules/react-native-vector-icons'),
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      presets: ['module:@react-native/babel-preset'],
      plugins: [
        // optional — webpack alias already maps RN -> RNW, but this doesn’t hurt
        'react-native-web',
        '@babel/plugin-proposal-export-namespace-from',
        '@babel/plugin-transform-modules-commonjs',
      ],
    },
  },
};

const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png|svg)$/i,
  type: 'asset', // webpack 5-friendly; replaces url-loader/file-loader
};

const ttfLoaderConfiguration = {
  test: /\.ttf$/i,
  type: 'asset/resource',
};

module.exports = {
  entry: { app: path.join(appDirectory, 'index.web.js') },
  output: {
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
    new HtmlWebpackPlugin({ template: path.join(__dirname, 'index.html') }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({ __DEV__: JSON.stringify(true) }),
  ],
  devServer: {
    open: true,
    hot: true,
  },
};
