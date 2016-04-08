var webpack = require("webpack")
module.exports = {
  entry: './webpack-entry.js',
  output: {
    filename: 'bundle.js',
    path: __dirname + '/dist'
  },
  devtool: "eval",
  module: {
    loaders: [
      { test: /\.less$/,
        loader: "style!css!less?strictMath&noIeCompat" },
      { test: /\.css$/,
        loader: "style!css" },
      { test: /\.png$/, loader: "url-loader?limit=100000" },
      { test: /\.jsx$/,
        exclude: /(node_modules|bower_components|vendor)/,
        loader: 'babel?optional[]=runtime&stage=0' },
      { test: /\.jade$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'jade' },
    ]
  },
  resolve: {
    extensions: ["", ".web.jsx", ".web.js", ".jsx", ".js"],
    alias: {
    }
  },
  plugins: [
  ]
};