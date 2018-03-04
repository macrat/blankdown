import assert from 'power-assert';
import regeneratorRuntime from 'regenerator-runtime';

import axios from 'axios';

const ORIGIN = `http://localhost:${process.env.PORT || 8000}`;


describe('blackbox', () => {
	describe('static files', () => {
		it('index.html', async () => {
			const index = await axios.get(ORIGIN);
			assert.equal(index.status, 200);
			assert.equal(index.headers['content-type'], 'text/html; charset=UTF-8');
			assert(index.data.length > 0);

			const shortcuts = await axios.get(ORIGIN + '/shortcuts');
			assert.equal(shortcuts.status, 200);
			assert.equal(shortcuts.headers['content-type'], 'text/html; charset=UTF-8');
			assert(shortcuts.data.length > 0);

			const about = await axios.get(ORIGIN + '/about');
			assert.equal(about.status, 200);
			assert.equal(about.headers['content-type'], 'text/html; charset=UTF-8');
			assert(about.data.length > 0);

			assert.equal(shortcuts.data, index.data);
			assert.equal(about.data, index.data);
		});

		it('app.js', async () => {
			const js = await axios.get(ORIGIN + '/app.js');
			assert.equal(js.status, 200);
			assert.equal(js.headers['content-type'], 'application/javascript; charset=UTF-8');
			assert(js.data.length > 0);
		});
	});
});
