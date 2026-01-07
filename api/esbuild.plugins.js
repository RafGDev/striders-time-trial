const { esbuildDecorators } = require("esbuild-decorators");
const path = require("path");

module.exports = [
  esbuildDecorators({
    tsconfig: path.resolve(__dirname, "tsconfig.json"),
    cwd: __dirname,
  }),
];

