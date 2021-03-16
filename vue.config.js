/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require('webpack');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin')

module.exports = {
  configureWebpack: {
    target: "electron-renderer",
    plugins: [
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale\/(en|id)\.js$/,
        contextRegExp: /moment$/
      }),
      new MomentLocalesPlugin({
        localesToKeep: ['id']
      })
    ]
  },
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        win: {
          icon: './icon.ico'
        }
      }
    }
  }
}