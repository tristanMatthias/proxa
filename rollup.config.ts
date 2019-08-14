// rollup.config.js
import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

// tslint:disable no-default-export
export default {
  input: './src/proxa.ts',

  output: [
    {
      file: pkg.main,
      format: 'cjs'
    },
    {
      file: pkg.module,
      format: 'es' // the preferred format
    },
    {
      name: 'window',
      file: pkg.browser,
      format: 'umd',
      extend: true
    }
  ],

  plugins: [
    typescript(),
    resolve(),
    commonjs(),
    terser({
      sourcemap: true
    })
  ]
};
