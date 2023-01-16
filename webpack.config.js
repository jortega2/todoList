const path = require('path');

module.exports = {
  mode: 'development',
  entry: '',
  output: {
    filename: '',
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'inline-source-map',
};
