const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const fs = require('fs');
const crypto = require('crypto');

require('dotenv').config();


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


const clientConfig = {
	entry: {
		app: './client/index.js',
		ServiceWorker: './client/worker/index.js',
	},
	output: {
		filename: '[name].js',
		chunkFilename: '[name].js',
		path: path.join(__dirname, 'build', 'public'),
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
	plugins: [
		new webpack.DefinePlugin({
			VERSION_CODE: JSON.stringify(VERSION_CODE),
			AUTH0_CLIENT_ID: JSON.stringify(process.env.AUTH0_CLIENT_ID),
			AUTH0_DOMAIN: JSON.stringify(process.env.AUTH0_DOMAIN),
		}),
		new CopyWebpackPlugin([{
			from: path.join(__dirname, 'client/static'),
			to: path.join(__dirname, 'build', 'public'),
			ignore: ['.*'],
		}]),
	],
	devtool: '#eval-source-map',
};

if (process.env.NODE_ENV === 'production') {
	clientConfig.devtool = '#source-map',

	clientConfig.plugins = (clientConfig.plugins || []).concat([
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


const serverConfig = {
	entry: './server/index.js',
	output: {
		filename: 'server.js',
		path: path.join(__dirname, 'build'),
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				loader: 'babel-loader',
			},
		],
	},
	target: 'node',
	node: {
		__dirname: false,
	},
	externals: [nodeExternals()],
	devtool: '#eval-source-map',
};


module.exports = [clientConfig, serverConfig];
