const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'GameComplete.js',
        // The library name is the global variable name (if using a browser global)
        library: 'GameComplete',
        // UMD format makes the library consumable in various environments (CommonJS, AMD, or as a global variable)
        libraryTarget: 'umd',
        // This ensures the UMD build works in Node and browser environments
        globalObject: 'this'
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
