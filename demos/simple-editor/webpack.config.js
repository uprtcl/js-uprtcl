/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  resolve: {
    alias: {
      'lit-element': path.resolve('./node_modules/lit-element'),
      graphql: path.resolve('./node_modules/graphql'),
      'lit-html': path.resolve('./node_modules/lit-html'),
      '@material': path.resolve('./node_modules/@material'),
      '@authentic': path.resolve('./node_modules/@authentic')
    }
  },
  entry: ['babel-polyfill', './src/index.js'],
  devServer: {
    historyApiFallback: true,
    port: 8080
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', { targets: { ie: '11' } }]],
            plugins: ['@babel/plugin-syntax-dynamic-import']
          }
        }
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin(['node_modules/@webcomponents/webcomponentsjs/**']),
    new HtmlWebpackPlugin({
      chunksSortMode: 'none',
      template: 'index.html'
    }),
  ]
};
