/* eslint-disable import/no-extraneous-dependencies */
const cjsTransformer = require('es-dev-commonjs-transformer');
const { createDefaultConfig } = require('@open-wc/testing-karma');
const deepmerge = require('deepmerge');

module.exports = config => {
  const defaultConfig = createDefaultConfig(config);
  config.set(
    deepmerge(defaultConfig, {
      coverageIstanbulReporter: {
        thresholds: {
          global: {
            statements: 0,
            lines: 0,
            branches: 0,
            functions: 0,
          },
        },
      },
      // see the karma-esm docs for all options
      esm: {
        babel: true,
        nodeResolve: true,
        fileExtensions: ['.ts', '.mjs'],
        responseTransformers: [
          cjsTransformer([
            ...defaultConfig.esm.babelModernExclude,
            '**/node_modules/@open-wc/**/*',
            '**/node_modules/chai/**/*',
            '**/node_modules/sinon-chai/**/*'
          ])
        ]
      },

      files: [
        {
          pattern: config.grep ? config.grep : 'test/**/*.test.ts',
          type: 'module'
        }
      ]
    })
  );

  return config;
};
