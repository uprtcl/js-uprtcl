const commonjs = require('@rollup/plugin-commonjs');
const sourceMaps = require('rollup-plugin-sourcemaps');
const typescript = require('rollup-plugin-typescript2');
const json = require('@rollup/plugin-json');

const pkg = require('./package.json');

const libraryName = 'uprtcl-wikis';

module.exports = {
  input: `src/${libraryName}.ts`,
  output: [
    { file: pkg.main, name: libraryName, format: 'umd', sourcemap: true },
    { file: pkg.module, format: 'es', sourcemap: true }
  ],
  watch: {
    include: 'src/**'
  },
  plugins: [
    json(),
    typescript({
      objectHashIgnoreUnknownHack: true,
      abortOnError: false,

      useTsconfigDeclarationDir: true,
      cacheRoot: `${require('temp-dir')}/.rpt2_cache`
    }),
    commonjs({
      namedExports: {
        'apollo-boost': ['gql', 'ApolloClient'],
        '../graphql/node_modules/graphql-tools/dist/index.js': ['makeExecutableSchema'],
        'node_modules/graphql-tools/dist/index.js': ['makeExecutableSchema']
      },
      exclude: [
        '**/node_modules/mocha/**/*',
        '**/node_modules/chai/**/*',
        '**/node_modules/sinon-chai/**/*',
        '**/node_modules/chai-dom/**/*',
        '**/node_modules/core-js-bundle/**/*'
      ]
    }),
    sourceMaps()
  ],
  preserveSymlinks: true
};
