import path from 'node:path'
import type {Config as SwcConfig} from '@swc/core'
import * as glob from 'glob'
import type {Configuration} from 'webpack'

import Dotenv from 'dotenv-webpack'
import TerserPlugin from 'terser-webpack-plugin'
import nodeExternals from 'webpack-node-externals'

const cwd = (p: string) => path.resolve(__dirname, p)

// [SWC](https://swc.rs) compiles TypeScript to JavaScript
const swcLoader = {
  loader: 'swc-loader',
  options: {
    jsc: {
      loose: true,
      target: 'es2020',
      parser: {
        syntax: 'typescript',
        decorators: true,
      },
      keepClassNames: true,
      transform: {
        legacyDecorator: true,
        decoratorMetadata: true,
      },
    },
  } satisfies SwcConfig,
}

// [Terser](https://terser.org) minifies the outputted JavaScript, using SWC under the hood.
const terserMinimizer = new TerserPlugin({
  minify: TerserPlugin.swcMinify,
  terserOptions: {
    sourceMap: true,
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
    },
  },
})

const sharedConfig = {
  mode: 'none',
  target: 'node',
  externals: {
    // vscode module is only provided to extensions during
    // extension runtime, and doesn't exists as a real dependency
    vscode: 'commonjs vscode',
  },
  output: {
    path: cwd('dist'),
    libraryTarget: 'commonjs2',
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.js'],
    mainFields: ['main', 'module'],
  },
  plugins: [
    new Dotenv({
      systemvars: true,
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [terserMinimizer],
  },
  node: {
    __filename: false,
  },
} satisfies Configuration

const buildConfig = {
  ...sharedConfig,
  name: 'build-extension',
  entry: './src/extension.ts',
  output: {
    ...sharedConfig.output,
    filename: 'extension.js',
  },
  plugins: sharedConfig.plugins,
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules|src\/test\/|test.ts/,
        use: swcLoader,
      },
    ],
  },
} satisfies Configuration

const browserConfig = {
  ...buildConfig,
  name: 'build-browser',
  output: {
    ...sharedConfig.output,
    filename: 'browser.js',
  },
  resolve: {
    ...sharedConfig.resolve,
    alias: {
      [cwd('src/utils/node')]: cwd('browser/node.js'),
    },
  },
} satisfies Configuration

const testConfig = {
  ...sharedConfig,
  name: 'build-tests',
  entry: [
    './src/test.ts',
    ...glob.globSync('./src/**/*.test.ts', {dotRelative: true}),
  ],
  output: {
    ...sharedConfig.output,
    filename: 'extension.test.js',
  },
  externals: [sharedConfig.externals, nodeExternals()],
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: swcLoader,
      },
    ],
  },
} satisfies Configuration

module.exports = [buildConfig, browserConfig, testConfig]
