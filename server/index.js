const generateUUID = require('uuid/v4');

import path from 'path';


import Markdown from '../common/Markdown.js';
import Database from './Database.js';


import { default as documents, ids as documentIDs } from '../common/documents.js';
const documentsPattern = documentIDs.join('|');


const express = require('express');
const app = express();
app.set('x-powered-by', false);
app.use(require('morgan')('combined'));
app.use(require('body-parser').text({ type: '*/*' }));
app.use(express.static(path.join(__dirname, 'public'), {maxage: process.env.NODE_ENV === 'production' ? '7d' : '0'}));

app.use((req, res, next) => {
	if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
		res.redirect('https://' + req.headers.host + req.url);
	} else {
		next();
	}
});

const server = app.listen(process.env.PORT || 8000, () => {
	console.log(`running at http://localhost:${server.address().port}`);
});


// for debug  TODO: replace it
app.use((req, res, next) => {
	req.user = {
		id: 'testuser',
	};
	next();
});


const UUID_pattern = '([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})';


const router = require('express-async-router').AsyncRouter({ send: false });
app.use('/', router);


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


function login_required(func) {
	return async function(req, res) {
		if (!req.user) {
			res.status(403).json({ error: 'authorization required' });
			return;
		}

		return await func(req, res);
	}
}


if (process.env.NODE_ENV !== 'production') {
	router.get('/v1/debug/database/clear', (req, res) => {
		Database.clearAll()
			.then(() => res.status(201).send('done'))
			.catch(e => res.status(500).send('failed'))
	});
}


router.post('/v1/create', login_required(async (req, res) => {
	let request;
	try {
		request = JSON.parse(req.body);
	} catch (e) {
		res.status(400).json({ error: 'invalid json' });
		return;
	}

	if (!request.modified && (request.modified < (new Date('2000-01-01')).getTime()/1000.0 || (new Date()).getTime()/1000.0 < request.modified)) {
		res.status(400).json({ error: 'invalid modified timestamp', modified: { requested: request.modified || null }});
		return;
	}

	if (!request.accessed && (request.accessed < (new Date('2000-01-01')).getTime()/1000.0 || (new Date()).getTime()/1000.0 < request.accessed)) {
		res.status(400).json({ error: 'invalid accessed timestamp', accessed: { requested: request.accessed || null }});
		return;
	}

	const pageID = generateUUID();
	const timestamp = (new Date()).getTime() / 1000.0;

	const modified = request.modified || timestamp;
	const accessed = Math.max(modified, request.accessed || timestamp);

	await Database.insert(pageID, req.user.id, accessed * 1000, modified * 1000, request.markdown || '', false);

	res.set('Location', `/${pageID}.json`);
	res.status(201).json({
		id: pageID,
		author: req.user.id,
		name: Markdown.getNameBy(request.markdown) || '',
		accessed: accessed,
		modified: modified,
		public: false,
	});
}));


router.get('/v1/pages', login_required(async (req, res) => {
	const result = await Database.getUserPages(req.user.id);

	const pages = result.map(x => {
		return {
			id: x.id,
			name: Markdown.getNameBy(x.markdown),
			accessed: x.accessed / 1000.0,
			modified: x.modified / 1000.0,
			public: x.public,
		};
	});

	if (pages.length > 0) {
		res.set('Last-Modified', new Date(result[0].accessed).toUTCString());
	}
	res.set('Expires', '0');
	res.set('Cache-Control', 'no-cache');

	res.status(200).json({
		pages: pages
	});
}));


router.get('/v1/search', async (req, res) => {
	const result = await Database.searchPage(req.query.q.split(' '), req.user ? req.user.id : null);

	if (result.length > 0) {
		res.set('Last-Modified', new Date(result[0].modified).toUTCString());
	}
	res.set('Expires', '0');
	res.set('Cache-Control', 'no-cache');

	res.status(200).json({ result: result.map(x => {
		return {
			id: x.id,
			author: x.author,
			name: Markdown.getNameBy(x.markdown),
			modified: x.modified / 1000.0,
			public: x.public,
		};
	}), });
});


router.delete(new RegExp(`^/${UUID_pattern}\.json$`), login_required(async (req, res) => {
	const pageID = req.params[0].toLowerCase();

	const author = await Database.getPageAuthor(pageID);

	if (!author) {
		res.status(404).json({ error: 'not found' });
		return;
	}

	if (author !== req.user.id) {
		res.status(403).json({ error: 'permission denied' });
		return;
	}

	await Database.removePage(pageID);

	res.status(200).json({});
}));


router.get(new RegExp(`^/${UUID_pattern}\.json$`), async (req, res) => {
	const page = await Database.getPage(req.params[0].toLowerCase());

	if (!page) {
		res.status(404).json({ error: 'not found' });
		return;
	}

	if (!page.public && (!req.user || page.author !== req.user.id)) {
		res.status(403).json({ error: 'permission denied' });
		return;
	}

	res.set('Last-Modified', new Date(page.accessed).toUTCString());
	res.status(200).json(Object.assign(page, {
		accessed: page.accessed / 1000.0,
		modified: page.modified / 1000.0,
		name: Markdown.getNameBy(page.markdown),
	}));
});


router.patch(new RegExp(`^/${UUID_pattern}\.json$`), login_required(async (req, res) => {
	const page_id = req.params[0].toLowerCase();

	if (!req.body) {
		res.status(400).json({ error: 'json data required' });
		return;
	}

	let request;
	try {
		request = JSON.parse(req.body);
	} catch (e) {
		res.status(400).json({ error: 'invalid json' });
		return;
	}

	if (!request.modified && (request.markdown || request.public)) {
		res.status(400).json({ error: 'modified timestamp is required if modify data' });
		return;
	}

	if (request.modified && (request.modified < (new Date('2000-01-01')).getTime()/1000.0 || (new Date()).getTime()/1000.0 < request.modified)) {
		res.status(400).json({ error: 'invalid modified timestamp', modified: { requested: request.modified || null }});
		return;
	}

	if (request.accessed && (request.accessed < (new Date('2000-01-01')).getTime()/1000.0 || (new Date()).getTime()/1000.0 < request.accessed || request.accessed < request.modified)) {
		res.status(400).json({ error: 'invalid accessed timestamp', accessed: { requested: request.accessed }});
		return;
	}

	if (request.modified) {
		request.modified = request.modified * 1000.0;
	}
	if (request.accessed) {
		request.accessed = request.accessed * 1000.0;
	}
	const error = await Database.updatePage(req.user.id, page_id, request);
	if (!error) {
		res.status(200).json({});
	} else {
		switch (error.code) {
		case 404:
			res.status(404).json({ error: 'not found' });
			break;

		case 403:
			res.status(403).json({ error: 'permission denied' });
			break;

		case 409:
			res.status(409).json({
				error: 'modified timestamp was conflict',
				modified: { server: error.modified, requested: request.modified },
			});
			break;
		}
	}
}));


router.get(new RegExp(`^/${UUID_pattern}\.md$`), async (req, res) => {
	const page = await Database.getMarkdown(req.params[0].toLowerCase());

	res.set('Content-Type', 'text/markdown');

	if (!page) {
		res.status(404).end('# not found\n');
		return;
	}

	if (!page.public && (!req.user || page.author !== req.user.id)) {
		res.status(403).end('# permission denied\n');
		return;
	}

	res.set('Last-Modified', new Date(page.modified).toUTCString());
	res.status(200).end(page.markdown);
});


router.get(new RegExp(`^/${UUID_pattern}\.html$`), async (req, res) => {
	const page = await Database.getMarkdown(req.params[0].toLowerCase());

	res.set('Content-Type', 'text/html');

	if (!page) {
		res.status(404).end('<h1>not found</h1>\n');
		return;
	}

	if (!page && (!req.user || page.author !== req.user.id)) {
		res.status(403).end('<h1>permission denied<h1>\n');
		return;
	}

	res.set('Last-Modified', new Date(page.modified).toUTCString());
	res.status(200).end(Markdown.toHTML(page.markdown));
});


router.get(new RegExp(`^/(${documentsPattern}).json$`), async (req, res) => {
	const documentID = req.params[0].toLowerCase();

	const doc = documents[documentID];

	if (!doc) {
		res.status(404).json({ error: 'not found' });
		return;
	}

	res.status(200).json({
		id: documentID,
		author: 'blankdown',
		name: Markdown.getNameBy(doc),
		markdown: doc,
		accessed: null,
		modified: null,
		public: true,
	});
});


router.get(new RegExp(`^/(${documentsPattern}).md$`), async (req, res) => {
	const documentID = req.params[0].toLowerCase();

	const doc = documents[documentID];

	res.set('Content-Type', 'text/markdown');

	if (!doc) {
		res.status(404).end('# not found\n');
		return;
	}

	res.status(200).end(doc);
});


router.get(new RegExp(`^/(${documentsPattern}).md$`), async (req, res) => {
	const documentID = req.params[0].toLowerCase();

	const doc = documents[documentID];

	res.set('Content-Type', 'text/html');

	if (!doc) {
		res.status(404).end('<h1>not found</h1>\n');
		return;
	}

	res.status(200).end(Markdown.toHTML(doc));
});
