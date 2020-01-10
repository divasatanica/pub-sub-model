const TSPlugin = require('rollup-plugin-typescript2');

// rollup.config.js
module.exports = {
    input: 'src/index.ts',
    plugins: [
        TSPlugin({
          typescript: require('typescript')
        })
    ]
};