module.exports = {
  mode: 'modules',
  out: 'docs',
  includes: 'guides/',
  exclude: [
    '**/node_modules/**',
    '**/*.spec.ts',
    '**/*.test.ts',
    '**/test/**/*',
    'tools/**/*',
    'demos/**/*'
  ],
  name: 'js-uprtcl',
  excludePrivate: true,
  skipInternal: true
};
