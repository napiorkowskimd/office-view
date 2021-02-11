const webpack = require("webpack");

module.exports = {
  pages: {
    client: {
      entry: "src/client/client.js",
      template: "public/client.html",
      filename: "client.html"
    },
    sender: {
      entry: "src/sender/sender.js",
      template: "public/sender.html",
      filename: "sender.html"
    }
  },
  devServer: { https: true },
  configureWebpack: {
    devtool: "source-map",
    plugins: [
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(
          process.env.NODE_ENV || "development"
        )
      })
    ]
  }
};
