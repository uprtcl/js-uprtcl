import sourceMaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
const pkg = require('./package.json');
// import { resolve } from 'path';

const libraryName = 'uprtcl-documents';

export default {
  input: `src/${libraryName}.ts`,
  output: [
    { file: pkg.main, name: libraryName, format: 'umd', sourcemap: true },
    { file: pkg.module, format: 'es', sourcemap: true }
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash-es')
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
    'lit-html',
    'lodash-es/isEqual'
  ],
  watch: {
    include: 'src/**'
  },
  plugins: [
    // Allow json resolution
    json(),
    // Compile TypeScript files
    typescript({
      objectHashIgnoreUnknownHack: true,
      abortOnError: false,
      // include: ['./node_modules/codemirror/mode/javascript.js'],
      useTsconfigDeclarationDir: true,
      cacheRoot: `${require('temp-dir')}/.rpt2_cache`
    }),

    // Resolve source maps to the original source
    sourceMaps(),
    resolve(),
    commonjs({
      extensions: ['.js', '.ts']
    })
  ]
};
