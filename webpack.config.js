const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'static'),
    },
    devServer: {
        static: './static',
        port: 8080, // Default port for the dev server
        historyApiFallback: true // Redirects 404 to index, allows for URI params
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
