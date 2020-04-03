const commonjs = require('@rollup/plugin-commonjs');
const resolve = require('@rollup/plugin-node-resolve');
const replace = require('@rollup/plugin-replace');
const rollupConfig = require('./rollup.config');
const builtins = require('rollup-plugin-node-builtins');
const globals = require('rollup-plugin-node-globals');

module.exports = config =>
  config.set({
    browsers: ['Chrome'],
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
          'process.env.NODE_ENV': JSON.stringify('production'),
          'var _2 = require(".");':
            'var _2 = {extendResolversFromInterfaces: require("./extendResolversFromInterfaces").default,checkForResolveTypeResolver: require("./checkForResolveTypeResolver").default};',
          'Object.defineProperty(exports, "__esModule", { value: true });\nvar _1 = require(".");':
            'Object.defineProperty(exports, "__esModule", { value: true });\nvar _1 = {checkForResolveTypeResolver: require("./checkForResolveTypeResolver").default};',
          delimiters: ['', '']
        }),
        globals(),
        builtins(),
        ...rollupConfig.plugins,

        resolve({
          browser: true,
          preferBuiltins: false,
          dedupe: [
            'graphql',
            'graphql-tag',
            'graphql-tools',
            'cids',
            'cbor-js',
            'fast-json-stable-stringify',
            '@holochain/hc-web-client',
            'multihashing-async',
            'randomcolor',
            'inversify',
            'ipfs-http-client',
            'zen-observable',
            'prosemirror-commands',
            'prosemirror-keymap',
            'prosemirror-model',
            'prosemirror-state',
            'prosemirror-view',
            'form-data',
            'deprecated-decorator',
            'buffer',
            'web3'
          ]
        }),
        // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
        commonjs({
          include: [
            '**/node_modules/cids/**/*',
            '**/node_modules/fast-json-stable-stringify/**',
            '**/node_modules/zen-observable/**',
            '**/node_modules/form-data/**',
            '**/node_modules/node-fetch/**',
            '**/node_modules/inversify/**',
            '**/node_modules/deprecated-decorator/**',
            '**/node_modules/graphql/**',
            '**/node_modules/graphql-tag/**',
            '**/node_modules/randomcolor/**',
            '**/node_modules/cbor-js/**',
            '**/node_modules/web3/**',
            '**/node_modules/rpc-websockets/**',
            /node_modules\/web3/,
            '**/node_modules/@babel/**',
            '**/node_modules/@holochain/**',
            '**/node_modules/ipfs-http-client/**',
            '**/node_modules/multihashing-async/**'
          ],
          namedExports: {
            'apollo-boost': ['gql', 'ApolloClient'],
            buffer: ['buffer'],
            cids: ['CID'],
            'cbor-js': ['CBOR'],
            'multihashing-async': ['default'],
            'buffer-es6': ['default'],
            'ipfs-http-client': ['default'],
            'graphql-tag': ['default'],
            'graphql-tools': ['makeExecutableSchema'],
            'fast-json-stable-stringify': ['stringify', 'default'],
            web3: ['default'],
            'zen-observable': ['default']
          },
          exclude: [
            '**/node_modules/mocha/**/*',
            '**/node_modules/chai/**/*',
            '**/node_modules/sinon-chai/**/*',
            '**/node_modules/chai-dom/**/*',
            '**/node_modules/core-js-bundle/**/*'
          ]
        })
      ]
    },
    singleRun: false,
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
