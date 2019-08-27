module.exports = {
  port: 8080,
  watch: true,
  nodeResolve: true,
  appIndex: 'demos/simple/index.html',
  moduleDirs: [
    'node_modules',
    'demos/simple/node_modules',
    'packages/core/node_modules',
    'packages/lenses/node_modules',
    'packages/common/node_modules'
  ],
  rootDir: '../../'
};
