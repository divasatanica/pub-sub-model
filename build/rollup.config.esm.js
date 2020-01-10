const baseConfig = require('./rollup.config');

module.exports = {
    ...baseConfig,
    output: {
        file: 'dist/index.esm.js',
        format: 'esm'
    }
};