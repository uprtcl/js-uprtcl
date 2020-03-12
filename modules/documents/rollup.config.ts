const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const sourceMaps = require('rollup-plugin-sourcemaps');
const typescript = require('rollup-plugin-typescript2');
const json = require('@rollup/plugin-json');

const pkg = require('./package.json');

const libraryName = 'uprtcl-documents';

module.exports = {
  input: `src/${libraryName}.ts`,
  output: [
    { file: pkg.main, name: libraryName, format: 'umd', sourcemap: true },
    { file: pkg.module, format: 'es', sourcemap: true }
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash-es')
  external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
  watch: {
    include: 'src/**'
  },
  plugins: [
    // Allow json resolution
    json(),
    // Compile TypeScript files
    typescript({
      objectHashIgnoreUnknownHack: true,
      abortOnError: false,

      useTsconfigDeclarationDir: true,
      cacheRoot: `${require('temp-dir')}/.rpt2_cache`
    }),
    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/@rollup/plugin-node-resolve#usage
    resolve({ browser: true, preferBuiltins: false, dedupe: ['graphql-tools'] }),
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs({
      include: [
        '**/node_modules/cids/**/*',
        '**/node_modules/fast-json-stable-stringify/**',
        '**/node_modules/zen-observable/**',
        '**/node_modules/inversify/**',
        '**/node_modules/graphql-tag/**',
        '**/node_modules/cbor-js/**',
        '**/node_modules/web3/**',
        '**/node_modules/@holochain/**',
        '**/node_modules/ipfs-http-client/**',
        '**/node_modules/multihashing-async/**'
      ],
      namedExports: {
        'apollo-boost': ['gql', 'ApolloClient'],
        'graphql-tools': ['makeExecutableSchema'],
        'node_modules/@uprtcl/evees/node_modules/cids/src/index.js': ['CID']
      },
      exclude: [
        '**/node_modules/mocha/**/*',
        '**/node_modules/chai/**/*',
        '**/node_modules/sinon-chai/**/*',
        '**/node_modules/chai-dom/**/*',
        '**/node_modules/core-js-bundle/**/*'
      ]
    }),

    // Resolve source maps to the original source
    sourceMaps()
  ]
};
