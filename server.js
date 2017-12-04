const generateUUID = require('uuid/v4');


const marked = require('marked');
const hljs = require('highlight.js');

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
		await client.query("CREATE TABLE IF NOT EXISTS pages (id CHAR(36) PRIMARY KEY, author VARCHAR(40) NOT NULL, last_updated BIGINT NOT NULL, markdown TEXT NOT NULL, public CHAR(1) NOT NULL DEFAULT 'N' CHECK (public = 'Y' OR public = 'N'))");
	} finally {
		client.release();
	}
})();


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


const router = require('express-async-router').AsyncRouter({ send: false });
app.use('/', router);


app.use('/', (req, res, next) => {
	res.sendfile('index.html', err => next(err));
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
	const page_id = generateUUID();
	const timestamp = (new Date()).getTime();

	if (!req.body) {
		res.status(400).json({ error: 'can\'t make empty page' });
		return;
	}

	const client = await db.connect();

	try {
		await client.query("INSERT INTO pages VALUES ($1, $2, $3, $4)", [page_id, req.user.id, timestamp, req.body]);
	} finally {
		client.release();
	}

	res.set('Location', `/${page_id}.json`);
	res.status(201).json({
		id: page_id,
		author: req.user.id,
		markdown: req.body,
		last_updated: timestamp / 1000.0,
		public: false,
	});
}));


router.get('/v1/pages', login_required(async (req, res) => {
	function get_name_by_markdown(markdown) {
		const idx = markdown.indexOf('\n');
		if (idx >= 0) {
			return markdown.slice(0, idx).trim().replace(/^#+ /, '').trim();
		} else {
			return markdown.trim().replace(/^#+ /, '').trim();
		}
	}

	const client = await db.connect();

	let result;
	try {
		result = await client.query("SELECT id, last_updated, markdown, public FROM pages WHERE author = $1 ORDER BY last_updated DESC", [req.user.id]);
	} finally {
		client.release();
	}

	const pages = result.rows.map(x => {
		return {
			id: x.id,
			last_updated: x.last_updated / 1000.0,
			name: get_name_by_markdown(x.markdown),
			public: x.public === 'Y',
		};
	});

	if (pages.length > 0) {
		res.set('Last-Modified', new Date(pages[0].last_updated * 1000).toUTCString());
	}

	res.status(200).json({
		pages: pages
	});
}));


const UUID_pattern = '([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})';


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
		result = await client.query("SELECT author, last_updated, markdown, public FROM pages WHERE id = $1", [page_id]);
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

	res.set('Last-Modified', new Date(Number.parseInt(data.last_updated)).toUTCString());
	res.status(200).json({
		id: page_id,
		author: data.author,
		markdown: data.markdown,
		last_updated: data.last_updated / 1000.0,
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

	if (!request.last_updated || request.last_updated < (new Date('2000-01-01')).getTime()/1000.0 || (new Date()).getTime()/1000.0 < request.last_updated) {
		res.status(400).json({ error: 'invalid last_updated', content: { requested: request.last_updated }});
		return;
	}

	const client = await db.connect();

	try {
		await client.query("BEGIN");

		const result = await client.query("SELECT author, last_updated, markdown, public FROM pages WHERE id = $1", [page_id]);

		if (!result || !result.rows || !result.rows[0]) {
			res.status(404).json({ error: 'not found' });
			return;
		}

		const data = result.rows[0];

		if (data.author !== req.user.id) {
			res.status(403).json({ error: 'permission denied' });
			return;
		}

		if (data.last_updated <= request.last_updated) {
			res.status(409).json({ error: 'last_updated was conflict', content: { server: data.last_updated, requested: request.last_updated }});
			return;
		}

		await client.query("UPDATE pages SET markdown=$2, public=$3, last_updated=$4 WHERE id = $1", [
			page_id,
			request.markdown || data.markdown,
			(request.public == undefined) ? data.public : (request.public ? 'Y' : 'N'),
			request.last_updated * 1000,
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


router.get(new RegExp(`/${UUID_pattern}\.html`), async (req, res) => {
	const page_id = req.params[0].toLowerCase();

	const client = await db.connect();

	let result;
	try {
		result = await client.query("SELECT markdown, last_updated, author, public FROM pages WHERE id = $1", [page_id]);
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

	res.set('Last-Modified', new Date(Number.parseInt(data.last_updated)).toUTCString());
	res.status(200).end(marked(data.markdown, {
		sanitize: true,
	}));
});
