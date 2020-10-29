const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  output: {
    filename: 'main.[hash].bundle.js',
    path: path.resolve(__dirname, 'dist-pages')
  },
  resolve: {
    alias: {
      graphql: path.resolve('./node_modules/graphql'),
      'lit-html': path.resolve('./node_modules/lit-html'),
      'lit-element': path.resolve('./node_modules/lit-element')
    },
    extensions: ['.mjs', '.ts', '.tsx', '.js', '.json', '.css', '.scss', '.html']
  },
  entry: ['babel-polyfill', './src/index.ts'],
  devServer: {
    historyApiFallback: true,
    port: 8002
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
      },
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader'
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
      minify: true
    }),
    new CopyWebpackPlugin([{ from: 'src/img', to: 'img' }])
  ]
};
