import { createDefaultConfig } from '@open-wc/building-rollup';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import replace from 'rollup-plugin-replace';

const config = createDefaultConfig({ input: './index.html' });

// map if you use an array of configs, otherwise just extend the config
export default {
  ...config,
  plugins: [
    globals(),
    builtins(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    ...config.plugins,
    resolve({ browser: true, preferBuiltins: false }),
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs(),
    // Allow json resolution
    json()
  ]
};
