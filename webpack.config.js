const path = require('path');
const webpack = require('webpack');


module.exports = {
	entry: './src/app.js',
	output: {
		filename: 'app.js',
		path: path.join(__dirname, 'build'),
	},
	module: {
		rules: [
			{
					test: /\.css/,
					use: [
						'vue-style-loader',
						'css-loader',
					],
			},
			{
				test: /\.vue$/,
				loader: 'vue-loader',
			},
		],
	},
	devtool: '#eval-source-map',
};


if (process.env.NODE_ENV === 'production') {
	module.exports.devtool = '#source-map',

	UglifyJsPlugin = require('uglifyjs-webpack-plugin');

	module.exports.plugins = (module.exports.plugins || []).concat([
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: '"production"'
			},
		}),
		new UglifyJsPlugin({
			sourceMap: true,
		}),
		new webpack.LoaderOptionsPlugin({
			minimize: true
		}),
	]);
}
