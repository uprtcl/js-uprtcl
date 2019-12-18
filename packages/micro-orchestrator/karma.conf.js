/* eslint-disable import/no-extraneous-dependencies */
const { createDefaultConfig } = require('@open-wc/testing-karma');
const deepmerge = require('deepmerge');

module.exports = config => {
  config.set(
    deepmerge(createDefaultConfig(config), {
      // see the karma-esm docs for all options
      esm: {
        babel: true,
        nodeResolve: true,
        fileExtensions: ['.ts'],
        preserveSymlinks: true
      },

      files: [
        {
          pattern: config.grep ? config.grep : './test/**/*.test.ts',
          type: 'module'
        }
      ],

  // ## code coverage config
  coverageIstanbulReporter: {
    thresholds: {
      global: {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
      },
    },
  },
    })
  );

  return config;
};
