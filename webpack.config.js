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
    ],
  },
};

node: {
  fs: 'empty'
}
