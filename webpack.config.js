const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/game.v0.1.main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'static'),
    },
    devServer: {
        static: './static',
        port: 8080, // Default port for the dev server
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
        ],
    },
};
