const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

delete require.cache[require.resolve('./env')];
const { env } = require('./env');

module.exports = {
  resolve: {
    alias: {
      'lit-element': path.resolve('./node_modules/lit-element'),
      graphql: path.resolve('./node_modules/graphql'),
      'lit-html': path.resolve('./node_modules/lit-html')
    }
  },
  entry: ['babel-polyfill', env.entry],
  devServer: {
    historyApiFallback: true,
    port: 8084
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
    })
  ]
};
