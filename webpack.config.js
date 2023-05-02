module.exports = {
  experiments: {
    topLevelAwait: true
  },
  module: {
    rules: [
      {
        test: /\.html$/i,
        loader: "html-loader",
      },
      {
        test: /\.css$/i,
        loader: "css-loader",
      },
    ],
  },
};

node: {
  fs: 'empty'
}
