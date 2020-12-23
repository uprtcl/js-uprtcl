import sourceMaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';
import json from '@rollup/plugin-json';

const pkg = require('./package.json');

const libraryName = 'uprtcl-evees-polkadot';

export default {
  input: `src/${libraryName}.ts`,
  output: [
    { file: pkg.main, name: libraryName, format: 'umd', sourcemap: true },
    { file: pkg.module, format: 'es', sourcemap: true },
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ],
  watch: {
    buildDelay: 1000,
    include: 'src/**',
  },
  plugins: [
    // Allow json resolution
    json(),
    // Compile TypeScript files
    typescript({
      objectHashIgnoreUnknownHack: true,
      abortOnError: false,

      useTsconfigDeclarationDir: true,
      cacheRoot: `${require('temp-dir')}/.rpt2_cache`,
    }),
    commonjs({
      include: 'node_modules/**',
      namedExports: {
        'node_modules/orbit-db-access-controllers/src/ipfs-access-controller.js': [
          'IPFSAccessController',
        ],
      },
    }),
    // Resolve source maps to the original source
    sourceMaps(),
  ],
};
