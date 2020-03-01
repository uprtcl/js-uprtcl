const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const sourceMaps = require('rollup-plugin-sourcemaps');
const typescript = require('rollup-plugin-typescript2');
const json = require('@rollup/plugin-json');
const replace = require('@rollup/plugin-replace');

const pkg = require('./package.json');

const libraryName = 'uprtcl-multiplatform';

module.exports = {
  input: `src/${libraryName}.ts`,
  output: [
    { file: pkg.main, name: libraryName, format: 'umd', sourcemap: true },
    { file: pkg.module, format: 'es', sourcemap: true }
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash-es')
  external: [],
  watch: {
    include: 'src/**'
  },
  plugins: [
    replace({
      'var _2 = require(".");': 'var _2 = {extendResolversFromInterfaces: require("./extendResolversFromInterfaces").default,checkForResolveTypeResolver: require("./checkForResolveTypeResolver").default};',
      'Object.defineProperty(exports, "__esModule", { value: true });\nvar _1 = require(".");': 'Object.defineProperty(exports, "__esModule", { value: true });\nvar _1 = {checkForResolveTypeResolver: require("./checkForResolveTypeResolver").default};',
      delimiters: ['', '']
    }),
    // Allow json resolution
    json(),
    // Compile TypeScript files
    typescript({
      objectHashIgnoreUnknownHack: true,

      useTsconfigDeclarationDir: true,
      cacheRoot: `${require('temp-dir')}/.rpt2_cache`
    }),
    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/@rollup/plugin-node-resolve#usage
    resolve({
      browser: true,
      preferBuiltins: false,
      dedupe: ['graphql-tools', 'graphql', 'apollo-boost']
    }),
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs({
      namedExports: {
        'apollo-boost': ['gql', 'ApolloClient'],
        '../graphql/node_modules/graphql-tools/dist/index.js': ['makeExecutableSchema'],
        'node_modules/graphql-tools/dist/index.js': ['makeExecutableSchema']
      }
    }),

    // Resolve source maps to the original source
    sourceMaps()
  ],
  preserveSymlinks: false
};
