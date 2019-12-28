module.exports = {
  mode: 'modules',
  out: 'docs/api',
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
  skipInternal: true,
  theme: 'vuepress'
};
