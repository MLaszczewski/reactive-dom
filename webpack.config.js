module.exports = {
  context: __dirname,
  entry: "./index.js",
  devtool: "source-map",
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        //exclude: [/(node_modules)/],
        loader: 'babel', // 'babel-loader' is also a legal name to reference
        query: {
          presets: ['es2015'],
          plugins: [
            [
              "transform-react-jsx", {
                "pragma": "ReactiveDOM.createElement" // default pragma is React.createElement
              }
            ]
          ]
        }
      }
    ]
  }
}