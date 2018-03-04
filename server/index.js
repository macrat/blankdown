require('dotenv').config();

import path from 'path';

import { default as documents, ids as documentIDs } from '../common/documents.js';
const documentsPattern = documentIDs.join('|');


const express = require('express');
const app = express();
app.set('x-powered-by', false);
app.use(require('morgan')('combined'));

app.use((req, res, next) => {
	if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
		res.redirect('https://' + req.headers.host + req.url);
	} else {
		next();
	}
});


app.use(express.static(path.join(__dirname, 'public'), {maxage: process.env.NODE_ENV === 'production' ? '7d' : '0'}));


const server = app.listen(process.env.PORT || 8000, () => {
	console.log(`running at http://localhost:${server.address().port}`);
});


const UUID_pattern = '([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})';


app.get('/manifest.json', (req, res) => {
	res.status(200).json({
		short_name: "blankdown",
		name: "blankdown",
		description: "yet yet yet another markdown editor",
		start_url: "/",
		icons: [
			{
				sizes: "256x256",
				src: "/icon.svg",
				type: "image/svg+xml",
			},
			{
				sizes: "192x192",
				src: "/192x192.png",
				type: "image/png",
			},
			{
				sizes: "256x256 192x192 128x128 96x96 64x64 48x48 32x32 16x16",
				src: "/favicon.ico",
				type: "images/x-icon",
			},
		],
		background_color: "white",
		theme_color: "darkslategray",
		display: "standalone",
		orientation: "any",
		scope: "/",
	});
});


app.get('/ServiceWorker.js', async (req, res) => {
	res.sendFile('ServiceWorker.js', {
		root: path.join(__dirname, 'public'),
	});
});


app.get(`/(${UUID_pattern}|${documentsPattern})?`, (req, res) => {
	if (process.env.NODE_ENV === 'production') {
		res.set('Cache-Control', 'public, max-age=' + (7*24*60*60));
	}

	res.sendFile('index.html', {
		root: path.join(__dirname, 'public'),
	});
});


app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ error: 'internal server error' });
});
