const path = require('path');

module.exports = {
  entry: './src/Controller.ts',
  optimization: {
    // We no not want to minimize our code.
    minimize: false
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    libraryTarget: 'global',
    library: 'PixelGenerator',
    // umdNamedDefine: true,
    filename: 'lib/generator.js',
    path: path.resolve(__dirname, '.'),
  },
};