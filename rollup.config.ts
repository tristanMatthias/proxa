// rollup.config.js
import typescript from 'rollup-plugin-typescript2';
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import { terser } from "rollup-plugin-terser";
import pkg from './package.json';

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
      // file: pkg.browser,
      // format: 'iife',
      // moduleName: 'window',
      // name: 'proxa'
      name: 'window',
      file: pkg.browser,
      format: 'umd',
      extend: true
    }
  ],

  plugins: [
    typescript(/*{ plugin options }*/),
    // resolve({ //used to resolve NPM module reading from packages.json those entrypoint (ES6 - Main or Browser specific)
    //   jsnext: true,
    //   main: true,
    //   browser: true
    // }),
    resolve(),
    commonjs(),
    terser({
      sourcemap: true
    })
  ]
}
