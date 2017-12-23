const pg = require('pg');
const db = new pg.Pool({
	host: process.env.DB_HOST || 'localhost',
	port: process.env.DB_PORT || 5432,
	database: process.env.DB_NAME || 'blankdown',
	user: process.env.DB_USER || 'test',
	password: process.env.DB_PASSWORD || 'test',
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
				public BOOLEAN NOT NULL,
				CHECK(accessed >= modified)
			)
		`);
	} finally {
		client.release();
	}
})().catch(e => {
	console.error("failed connecting to database when initialization");
	console.error(e);
	throw e;
});


function rowToData(row) {
	return {
		id: row.id,
		author: row.author,
		accessed: Number.parseInt(row.accessed),
		modified: Number.parseInt(row.modified),
		markdown: row.markdown,
		public: row.public,
	};
}


const Database = {
	insert: async (id, author, accessed, modified, markdown, public_) => {
		const client = await db.connect();

		try {
			await client.query("INSERT INTO pages VALUES ($1, $2, $3, $4, $5, $6)", [id, author, accessed, modified, markdown, public_]);
		} finally {
			client.release();
		}
	},

	getPage: async (pageID) => {
		const client = await db.connect();

		try {
			const result = await client.query("SELECT author, accessed, modified, markdown, public FROM pages WHERE id = $1", [pageID]);
			if (result.rows[0]) {
				return rowToData(Object.assign({ id: pageID }, result.rows[0]));
			}
		} finally {
			client.release();
		}

		return null;
	},

	getUserPages: async (userID) => {
		const client = await db.connect();

		try {
			return (await client.query("SELECT id, accessed, modified, markdown, public FROM pages WHERE author = $1 ORDER BY accessed DESC", [userID])).rows.map(x => {
				return rowToData(Object.assign(x, { author: userID }));
			});
		} finally {
			client.release();
		}
	},

	getPageAuthor: async (pageID) => {
		const client = await db.connect();

		try {
			const result = await client.query("SELECT author FROM pages WHERE id = $1", [pageID]);
			if (result.rows[0]) {
				return result.rows[0].author;
			} else {
				return null;
			}
		} finally {
			client.release();
		}
	},

	removePage: async (pageID) => {
		const client = await db.connect();

		try {
			await client.query("DELETE FROM pages WHERE id = $1", [pageID]);
		} finally {
			client.release();
		}
	},

	getMarkdown: async (pageID) => {
		const client = await db.connect();

		try {
			const result = await client.query("SELECT markdown, modified, author, public FROM pages WHERE id = $1", [pageID]);
			if (result.rows[0]) {
				return {
					markdown: result.rows[0].markdown,
					modified: Number.parseInt(result.rows[0].modified),
					author: result.rows[0].author,
				};
			} else {
				return null;
			}
		} finally {
			client.release();
		}
	},

	updatePage: async (userID, pageID, data) => {
		const client = await db.connect();

		try {
			await client.query("BEGIN");

			const result = await client.query("SELECT author, accessed, modified, markdown, public FROM pages WHERE id = $1", [pageID]);

			if (!result.rows[0]) {
				return { code: 404 };
			}

			if (result.rows[0].author !== userID) {
				return { code: 403 };
			}

			if (result.rows[0].modified >= data.modified) {
				return { code: 409, modified: Number.parseInt(result.rows[0].modified) };
			}

			await client.query("UPDATE pages SET markdown=$2, public=$3, accessed=$4, modified=$5 WHERE id = $1", [
				pageID,
				data.markdown || result.rows[0].markdown,
				(data.public == undefined) ? result.rows[0].public : data.public,
				Math.max(data.accessed || 0, Number.parseInt(result.rows[0].accessed)),
				data.modified || Number.parseInt(result.rows[0].modified),
			]);

			await client.query("COMMIT");
		} catch (e) {
			await client.query("ROLLBACK");
			throw e;
		} finally {
			client.release();
		}

		return null;
	},

	searchPage: async (queries, userID=null) => {
		const searchQuery = queries.map(x => "markdown LIKE '%" + x.replace("'", "''") + "%'").join(' AND ');

		let result;
		if (userID) {
			result = await db.query("SELECT id, author, accessed, modified, markdown, public FROM pages WHERE (public OR author = $1) AND " + searchQuery + " ORDER BY modified DESC", [userID]);
		} else {
			result = await db.query("SELECT id, author, accessed, modified, markdown, public FROM pages WHERE public AND " + searchQuery + " ORDER BY modified DESC");
		}

		if (!result) {
			return [];
		}

		return result.rows.map(rowToData);
	},
};


if (process.env.NODE_ENV !== 'production') {
	Database.clearAll = function() {
		return db.query("DELETE FROM pages");
	}
}


export default Database;
