module.exports = {
  port: 8080,
  watch: true,
  nodeResolve: true,
  preserveSymlinks: true,
  appIndex: 'demos/simple/index.html',
  moduleDirs: [
    'node_modules',
    'demos/simple/node_modules',
    'packages/micro-orchestrator/node_modules',
    'packages/cortex/node_modules',
    'packages/common/node_modules'
  ],
  rootDir: '../../'
};
