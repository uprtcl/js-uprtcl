/* eslint-disable import/no-extraneous-dependencies */
const cjsTransformer = require('es-dev-commonjs-transformer');
const { createDefaultConfig } = require('@open-wc/testing-karma');
const deepmerge = require('deepmerge');

module.exports = config => {
  const defaultConfig = createDefaultConfig(config);
  config.set(
    deepmerge(defaultConfig, {
      // see the karma-esm docs for all options
      esm: {
        babel: true,
        nodeResolve: true,
        fileExtensions: ['.ts'],
        preserveSymLinks: true,
        responseTransformers: [
          cjsTransformer([
            ...defaultConfig.esm.babelModernExclude,
            '**/node_modules/@open-wc/**/*',
            '**/node_modules/chai-dom/**/*',
            '**/node_modules/sinon-chai/**/*',
            '**/node_modules/graphql/**/*'
          ])
        ]
      },

      logLevel: config.LOG_DEBUG,

      basePath: '../../',

      files: [
        { pattern: './tools/global-test-variables.js', type: 'module' },
        {
          pattern: config.grep ? config.grep : './packages/common/test/**/*.test.ts',
          type: 'module'
        }
      ]
    })
  );

  return config;
};
