module.exports = {
  mode: 'modules',
  out: 'docs',
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
