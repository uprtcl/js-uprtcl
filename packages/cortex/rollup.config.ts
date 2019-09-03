import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import sourceMaps from 'rollup-plugin-sourcemaps';
import { camelCase } from 'lodash';
import typescript from 'rollup-plugin-typescript2';
import json from 'rollup-plugin-json';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';

const pkg = require('./package.json');
pkg.dependencies['lodash/merge'] = '';
pkg.dependencies['lodash/uniq'] = '';

const libraryName = 'uprtcl-cortex';

export default {
  input: `src/${libraryName}.ts`,
  output: [
    { file: pkg.main, name: camelCase(libraryName), format: 'umd', sourcemap: true },
    { file: pkg.module, format: 'es', sourcemap: true }
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
  watch: {
    include: 'src/**'
  },
  plugins: [
    globals(),
    builtins(),
    // Allow json resolution
    json(),
    // Compile TypeScript files
    typescript({
      useTsconfigDeclarationDir: true,
      cacheRoot: `${require('temp-dir')}/.rpt2_cache`
    }),
    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/rollup-plugin-node-resolve#usage
    resolve({ browser: true, preferBuiltins: false }),
    commonjs(),
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)

    // Resolve source maps to the original source
    sourceMaps()
  ]
};
