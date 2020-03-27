const resolve = require('@rollup/plugin-node-resolve');
const replace = require('@rollup/plugin-replace');
const rollupConfig = require('./rollup.config');

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
        name: 'uprtclcortex', // Required for 'iife' format.,
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
        ...rollupConfig.plugins,
        resolve({
          browser: true,
          preferBuiltins: false,
          dedupe: [
            '@uprtcl/cortex',
            '@uprtcl/graphql',
            '@uprtcl/multiplatform',
            '@uprtcl/micro-orchestrator',
            'graphql-tools',
            'graphql',
            'graphql-tag'
          ]
        })
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
