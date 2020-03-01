/* eslint-disable import/no-extraneous-dependencies */
const rollupConfig = require('./rollup.config');

module.exports = config =>
  config.set({
    browsers: ['Chrome'],

    coverageIstanbulReporter: {
      thresholds: {
        global: {
          statements: 0,
          lines: 0,
          branches: 0,
          functions: 0
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
        format: 'es', // Helps prevent naming collisions.
        name: 'uprtclmultiplatform' // Required for 'iife' format.
      }
    },
    logLevel: config.LOG_DEBUG,

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
