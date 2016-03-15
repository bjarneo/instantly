'use strict';

var webpack = require('webpack');
var path = require('path');
var production = process.env.NODE_ENV === 'production';

module.exports = {
    devtool: production ? null : 'eval',

    output: {
        path: path.join(__dirname),
        filename: 'instantly.min.js',
        library: 'Instantly',
        libraryTarget: 'umd',
        umdNamedDefine: true
    },

    entry: [
        './src/instantly.js'
    ],

    plugins: production ? [
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurenceOrderPlugin(true),
        new webpack.optimize.UglifyJsPlugin(),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        })
    ] : [
        new webpack.NoErrorsPlugin()
    ]
};
