/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require('webpack');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin')

module.exports = {
  productionSourceMap: false,
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
    ],
  },
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        publish: [{
          provider: 'github',
          private: true,
          owner: 'NazirArifin',
          repo: 'disdikopschool',
          token: 'a49796418030f9a4b36604d9e7c884a6a6b6d3c7'
        }],
        win: {
          icon: './icon.ico'
        }
      }
    }
  }
}