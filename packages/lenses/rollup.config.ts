const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const sourceMaps = require('rollup-plugin-sourcemaps');
const typescript = require('rollup-plugin-typescript2');
const json = require('@rollup/plugin-json');

const pkg = require('./package.json');

const libraryName = 'uprtcl-lenses';

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
    json(),
    typescript({
      objectHashIgnoreUnknownHack: true,
      abortOnError: false,

      useTsconfigDeclarationDir: true,
      cacheRoot: `${require('temp-dir')}/.rpt2_cache`
    }),
    resolve({
      browser: true,
      preferBuiltins: false,
      dedupe: [
        '@uprtcl/cortex',
        '@uprtcl/graphql',
        '@uprtcl/multiplatform',
        '@uprtcl/micro-orchestrator',
        'graphql-tools',
        'lit-element',
        'graphql',
        'graphql-tag'
      ]
    }),
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
        '**/node_modules/multihashing-async/**',
        '**/node_modules/graphql-tools/**',
        /node_modules/
      ],
      namedExports: {
        'apollo-boost': ['gql', 'ApolloClient'],
        'graphql-tools': ['makeExecutableSchema'],
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
