const commonjs = require('@rollup/plugin-commonjs');
const resolve = require('@rollup/plugin-node-resolve');
const replace = require('@rollup/plugin-replace');
const rollupConfig = require('./rollup.config');
const builtins = require('rollup-plugin-node-builtins');
const globals = require('rollup-plugin-node-globals');

module.exports = config =>
  config.set({
    browsers: ['ChromeHeadlessNoSandbox'],
    // ## code coverage config
    coverageIstanbulReporter: {
      reports: ['lcovonly', 'text-summary'],
      combineBrowserReports: true,
      skipFilesWithNoCoverage: false,
      thresholds: {
        global: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80
        }
      }
    },

    preprocessors: {
      'test/**/*.test.ts': ['rollup']
    },
    rollupPreprocessor: {
      ...rollupConfig,
      external: [],
      output: {
        format: 'iife', // Helps prevent naming collisions.
        name: 'uprtcldocuments', // Required for 'iife' format.,
        sourcemap: true
      },
      plugins: [
        replace({
          'var _2 = require(".");':
            'var _2 = {extendResolversFromInterfaces: require("./extendResolversFromInterfaces").default,checkForResolveTypeResolver: require("./checkForResolveTypeResolver").default};',
          'Object.defineProperty(exports, "__esModule", { value: true });\nvar _1 = require(".");':
            'Object.defineProperty(exports, "__esModule", { value: true });\nvar _1 = {checkForResolveTypeResolver: require("./checkForResolveTypeResolver").default};',
          delimiters: ['', '']
        }),
        globals(),
        builtins(),
        ...rollupConfig.plugins,
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
            'node_modules/@uprtcl/evees/node_modules/cids/src/index.js': ['CID'],
            'fast-json-stable-stringify': ['stringify'],
            'node_modules/graphql-tools/dist/index.js,': ['makeExecutableSchema'],
            'prosemirror-model': ['Schema']
          },
          exclude: [
            '**/node_modules/mocha/**/*',
            '**/node_modules/chai/**/*',
            '**/node_modules/sinon-chai/**/*',
            '**/node_modules/chai-dom/**/*',
            '**/node_modules/core-js-bundle/**/*'
          ]
        }),

        resolve({ browser: true, preferBuiltins: false, dedupe: ['graphql-tools'] })
      ]
    },
    singleRun: true,
    concurrency: Infinity,

    plugins: [
      // resolve plugins relative to this config so that they don't always need to exist
      // at the top level
      require.resolve('karma-mocha'),
      require.resolve('karma-mocha-reporter'),
      require.resolve('karma-source-map-support'),
      require.resolve('karma-coverage-istanbul-reporter'),
      require.resolve('karma-snapshot'),
      require.resolve('karma-mocha-snapshot'),
      require.resolve('karma-chrome-launcher'),

      // fallback: resolve any karma- plugins
      'karma-*'
    ],
    frameworks: ['mocha', 'snapshot', 'mocha-snapshot', 'source-map-support'],
    reporters: ['mocha', 'coverage-istanbul'],
    colors: true,

    mochaReporter: {
      showDiff: true
    },
    logLevel: config.LOG_INFO,

    restartOnFileChange: true,
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    },
    files: [
      {
        pattern: config.grep ? config.grep : 'test/**/*.test.ts',
        type: 'module',
        watched: false
      }
    ]
  });
