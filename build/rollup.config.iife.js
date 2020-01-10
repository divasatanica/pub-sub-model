const baseConfig = require('./rollup.config');

module.exports = {
    ...baseConfig,
    output: {
        file: 'dist/index.iife.js',
        format: 'iife',
        name: 'ReactiveC'
    }
};