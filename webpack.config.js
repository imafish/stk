const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => {
  const isProd = argv.mode === "production";

  return {
    entry: {
      background: "./src/background/background.ts",
      inject: "./src/content/inject.ts",
      popup: "./src/popup/popup.ts",
      options: "./src/options/options.ts",
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
      clean: true,
    },
    devtool: isProd ? false : "inline-source-map",
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
      fallback: {
        fs: false,
        path: false,
      },
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: "src/popup/popup.html", to: "popup.html" },
          { from: "src/popup/popup.css", to: "popup.css" },
          { from: "src/options/options.html", to: "options.html" },
          { from: "src/styles/inject.css", to: "inject.css" },
          { from: "icons", to: "icons" },
          { from: "manifest.json", to: "manifest.json" },
        ],
      }),
    ],
  };
};
