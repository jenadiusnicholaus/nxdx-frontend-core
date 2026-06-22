"use strict";

const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");

const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

console.log("Creating production bundle");

module.exports = merge(common, {
  mode: "production",
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          mangle: false,
        },
      }),
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "app/template.html",
      minify: false,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.html$/,
        include: [path.resolve(__dirname, "app")],
        use: [
          {
            loader: "html-loader",
            options: {
              minimize: false,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          "css-loader",
        ],
      },
    ],
  },
});
