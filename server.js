const generateUUID = require('uuid/v4');


const marked = require('marked');
const hljs = require('highlight.js');

import { default as documents, ids as documentIDs } from './documents.mjs';
const documentsPattern = documentIDs.join('|');

marked.setOptions({
	highlight(code, lang) {
		try {
			if (lang) {
				return hljs.highlight(lang, code, true).value;
			} else {
				return hljs.highlightAuto(code).value;
			}
		} catch(e) {
			return code;
		}
	},
});


const pg = require('pg');
const db = new pg.Pool({
	host: process.env.DB_HOST || 'localhost',
	port: process.env.DB_PORT || 5432,
	database: process.env.DB_NAME || 'blankdown',
	user: process.env.DB_USER || 'test',
	password: process.env.DB_PASSWORD || 'test',
});
db.connect(err => {
	if (err) {
		console.error(err);
		throw err;
	}
});

(async () => {
	const client = await db.connect();

	try {
		await client.query(`
			CREATE TABLE IF NOT EXISTS pages (
				id CHAR(36) PRIMARY KEY CHECK(LENGTH(author) > 0),
				author VARCHAR(40) NOT NULL CHECK(LENGTH(author) > 0),
				accessed BIGINT NOT NULL,
				modified BIGINT NOT NULL,
				markdown TEXT NOT NULL,
				public CHAR(1) NOT NULL DEFAULT 'N' CHECK(public = 'Y' OR public = 'N'),
				CHECK(accessed >= modified)
			)
		`);
	} finally {
		client.release();
	}
})();


function get_name_by_markdown(markdown) {
	if (!markdown) {
		return '';
	}
	const idx = markdown.indexOf('\n');
	if (idx >= 0) {
		return markdown.slice(0, idx).trim().replace(/^#+ /, '').trim();
	} else {
		return markdown.trim().replace(/^#+ /, '').trim();
	}
}


const express = require('express');
const app = express();
app.set('etag', false);
app.set('x-powered-by', false);
app.use(require('morgan')('combined'));
app.use(require('body-parser').text({ type: '*/*' }));
app.use(express.static('build'));

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
	res.sendFile(__dirname + '/index.html');
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


router.post('/v1/create', login_required(async (req, res) => {
	if (!req.body.modified && (req.body.modified < (new Date('2000-01-01')).getTime()/1000.0 || (new Date()).getTime()/1000.0 < req.body.modified)) {
		res.status(400).json({ error: 'invalid modified timestamp', modified: { requested: req.body.modified || null }});
		return;
	}

	if (!req.body.accessed && (req.body.accessed < (new Date('2000-01-01')).getTime()/1000.0 || (new Date()).getTime()/1000.0 < req.body.accessed)) {
		res.status(400).json({ error: 'invalid accessed timestamp', accessed: { requested: req.body.accessed || null }});
		return;
	}

	const page_id = generateUUID();
	const timestamp = (new Date()).getTime();

	const modified = req.body.modified * 1000 || timestamp;
	const accessed = Math.max(modified, req.body.accessed * 1000 || timestamp);

	const client = await db.connect();

	try {
		await client.query("INSERT INTO pages VALUES ($1, $2, $3, $4, $5)", [page_id, req.user.id, accessed, modified, req.body.markdown || '']);
	} finally {
		client.release();
	}

	res.set('Location', `/${page_id}.json`);
	res.status(201).json({
		id: page_id,
		author: req.user.id,
		name: get_name_by_markdown(req.body.markdown) || '',
		accessed: accessed / 1000.0,
		modified: modified / 1000.0,
		public: false,
	});
}));


router.get('/v1/pages', login_required(async (req, res) => {
	const client = await db.connect();

	let result;
	try {
		result = await client.query("SELECT id, accessed, modified, markdown, public FROM pages WHERE author = $1 ORDER BY accessed DESC", [req.user.id]);
	} finally {
		client.release();
	}

	const pages = result.rows.map(x => {
		return {
			id: x.id,
			accessed: x.accessed / 1000.0,
			modified: x.modified / 1000.0,
			name: get_name_by_markdown(x.markdown),
			public: x.public === 'Y',
		};
	});

	if (pages.length > 0) {
		res.set('Last-Modified', new Date(pages[0].accessed * 1000).toUTCString());
	}

	res.status(200).json({
		pages: pages
	});
}));


router.delete(new RegExp(`/${UUID_pattern}\.json`), login_required(async (req, res) => {
	const page_id = req.params[0].toLowerCase();

	const client = await db.connect();

	try {
		const result = await client.query("SELECT author FROM pages WHERE id = $1", [page_id]);

		if (!result || !result.rows || !result.rows[0]) {
			res.status(404).json({ error: 'not found' });
			return;
		}

		if (result.rows[0].author !== req.user.id) {
			res.status(403).json({ error: 'permission denied' });
			return;
		}

		await client.query("DELETE FROM pages WHERE id = $1", [page_id]);

		res.status(200).json({});
	} finally {
		client.release();
	}
}));


router.get(new RegExp(`/${UUID_pattern}\.json`), async (req, res) => {
	const page_id = req.params[0].toLowerCase();

	const client = await db.connect();

	let result;
	try {
		result = await client.query("SELECT author, accessed, modified, markdown, public FROM pages WHERE id = $1", [page_id]);
	} finally {
		client.release();
	}

	if (!result || !result.rows || !result.rows[0]) {
		res.status(404).json({ error: 'not found' });
		return;
	}

	const data = result.rows[0];

	if (data.public !== 'Y' && (!req.user || data.author !== req.user.id)) {
		res.status(403).json({ error: 'permission denied' });
		return;
	}

	res.set('Last-Modified', new Date(Number.parseInt(data.modified)).toUTCString());
	res.status(200).json({
		id: page_id,
		author: data.author,
		name: get_name_by_markdown(data.markdown),
		markdown: data.markdown,
		accessed: data.accessed / 1000.0,
		modified: data.modified / 1000.0,
		public: data.public === 'Y',
	});
});


router.patch(new RegExp(`/${UUID_pattern}\.json`), login_required(async (req, res) => {
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

	if (!request.modified && (request.markdown || request.pubblic)) {
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

	const client = await db.connect();

	try {
		await client.query("BEGIN");

		const result = await client.query("SELECT author, accessed, modified, markdown, public FROM pages WHERE id = $1", [page_id]);

		if (!result || !result.rows || !result.rows[0]) {
			res.status(404).json({ error: 'not found' });
			return;
		}

		const data = result.rows[0];

		if (data.author !== req.user.id) {
			res.status(403).json({ error: 'permission denied' });
			return;
		}

		if (data.modified <= request.modified) {
			res.status(409).json({ error: 'modified timestamp was conflict', modified: { server: data.modified, requested: request.modified }});
			return;
		}

		await client.query("UPDATE pages SET markdown=$2, public=$3, accessed=$4, modified=$5 WHERE id = $1", [
			page_id,
			request.markdown || data.markdown,
			(request.public == undefined) ? data.public : (request.public ? 'Y' : 'N'),
			Math.max((request.accessed || 0) * 1000, Number.parseInt(data.accessed)),
			(request.modified * 1000 || Number.parseInt(data.modified)),
		]);

		await client.query("COMMIT");

		res.status(200).json({});
	} catch (e) {
		await client.query("ROLLBACK");
		throw e;
	} finally {
		client.release();
	}
}));


router.get(new RegExp(`/${UUID_pattern}\.md`), async (req, res) => {
	const page_id = req.params[0].toLowerCase();

	const client = await db.connect();

	let result;
	try {
		result = await client.query("SELECT markdown, modified, author, public FROM pages WHERE id = $1", [page_id]);
	} finally {
		client.release();
	}

	res.set('Content-Type', 'text/markdown');

	if (!result || !result.rows || !result.rows[0]) {
		res.status(404).end('# not found\n');
		return;
	}

	const data = result.rows[0];

	if (data.public !== 'Y' && (!req.user || data.author !== req.user.id)) {
		res.status(403).end('# permission denied\n');
		return;
	}

	res.set('Last-Modified', new Date(Number.parseInt(data.modified)).toUTCString());
	res.status(200).end(data.markdown);
});


router.get(new RegExp(`/${UUID_pattern}\.html`), async (req, res) => {
	const page_id = req.params[0].toLowerCase();

	const client = await db.connect();

	let result;
	try {
		result = await client.query("SELECT markdown, modified, author, public FROM pages WHERE id = $1", [page_id]);
	} finally {
		client.release();
	}

	res.set('Content-Type', 'text/html');

	if (!result || !result.rows || !result.rows[0]) {
		res.status(404).end('<h1>not found</h1>\n');
		return;
	}

	const data = result.rows[0];

	if (data.public !== 'Y' && (!req.user || data.author !== req.user.id)) {
		res.status(403).end('<h1>permission denied<h1>\n');
		return;
	}

	res.set('Last-Modified', new Date(Number.parseInt(data.modified)).toUTCString());
	res.status(200).end(marked(data.markdown, {
		sanitize: true,
	}));
});


router.get(new RegExp(`/(${documentsPattern}).json`), async (req, res) => {
	const documentID = req.params[0].toLowerCase();

	const doc = documents[documentID];

	if (!doc) {
		res.status(404).json({ error: 'not found' });
		return;
	}

	res.status(200).json({
		id: documentID,
		author: 'blankdown',
		name: get_name_by_markdown(doc),
		markdown: doc,
		accessed: null,
		modified: null,
		public: true,
	});
});


router.get(new RegExp(`/(${documentsPattern}).md`), async (req, res) => {
	const documentID = req.params[0].toLowerCase();

	const doc = documents[documentID];

	res.set('Content-Type', 'text/markdown');

	if (!doc) {
		res.status(404).end('# not found\n');
		return;
	}

	res.status(200).end(doc);
});


router.get(new RegExp(`/(${documentsPattern}).md`), async (req, res) => {
	const documentID = req.params[0].toLowerCase();

	const doc = documents[documentID];

	res.set('Content-Type', 'text/html');

	if (!doc) {
		res.status(404).end('<h1>not found</h1>\n');
		return;
	}

	res.status(200).end(marked(doc, {
		sanitize: true,
	}));
});
