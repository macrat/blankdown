const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const fs = require('fs');
const crypto = require('crypto');


const VERSION_CODE = (() => {
	function walk(basePath, fun) {
		const files = fs.readdirSync(basePath);
		for (const fname of files) {
			const fpath = path.join(basePath, fname);
			if (fs.statSync(fpath).isDirectory()) {
				walk(fpath, fun);
			} else {
				fun(fpath);
			}
		}
	}
	const cacheFiles = [];
	walk(path.join(__dirname, 'client'), f => cacheFiles.push(f));
	cacheFiles.sort();
	const hashMaker = crypto.createHash('md5');
	for (const file of cacheFiles) {
		const data = fs.readFileSync(file);
		hashMaker.update(data);
	}
	return hashMaker.digest('hex');
})();


module.exports = {
	entry: {
		app: './client/index.js',
		ServiceWorker: './worker/index.js',
	},
	output: {
		filename: '[name].js',
		chunkFilename: '[name].js',
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
	resolve: {
		extensions: ['.mjs', '.js', '.vue'],
	},
	plugins: [
		new webpack.DefinePlugin({
			VERSION_CODE: JSON.stringify(VERSION_CODE),
		}),
		new CopyWebpackPlugin([{
			from: path.join(__dirname, 'static'),
			to: path.join(__dirname, 'build'),
			ignore: ['.*'],
		}]),
	],
	devtool: '#eval-source-map',
};

if (process.env.NODE_ENV === 'production') {
	module.exports.devtool = '#source-map',

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
};
