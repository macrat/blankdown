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

	describe('API', () => {
		describe('v1', () => {
			it('create and get', async () => {
				const first = await axios.get(ORIGIN + '/v1/pages');
				assert.equal(first.status, 200);
				assert.equal(first.headers['content-type'], 'application/json; charset=utf-8');
				assert.deepStrictEqual(first.data, { pages: [] });

				const add = await axios.post(ORIGIN + '/v1/create', {
					markdown: '# this is test\ntest markdown',
					modified: new Date('2017-01-01').getTime() / 1000.0,
					accessed: new Date('2017-01-02').getTime() / 1000.0,
				});
				assert.equal(add.status, 201);
				assert.equal(add.headers['content-type'], 'application/json; charset=utf-8');
				assert(add.headers['location'].length > 0);
				assert.strictEqual(add.headers['location'], `/${add.data.id}.json`);
				assert.strictEqual(add.data.name, 'this is test');
				assert.strictEqual(add.data.author, 'testuser');
				assert.strictEqual(add.data.modified, new Date('2017-01-01').getTime() / 1000.0);
				assert.strictEqual(add.data.accessed, new Date('2017-01-02').getTime() / 1000.0);
				assert.strictEqual(add.data.public, false);

				const get = await axios.get(ORIGIN + add.headers['location']);
				assert.equal(get.status, 200);
				assert.equal(get.headers['content-type'], 'application/json; charset=utf-8');
				assert.equal(get.headers['last-modified'], new Date('2017-01-02').toUTCString());
				assert.deepStrictEqual(get.data, {
					id: add.data.id,
					name: 'this is test',
					markdown: '# this is test\ntest markdown',
					author: 'testuser',
					modified: new Date('2017-01-01').getTime() / 1000.0,
					accessed: new Date('2017-01-02').getTime() / 1000.0,
					public: false,
				});

				const second = await axios.get(ORIGIN + '/v1/pages');
				assert.equal(second.status, 200);
				assert.equal(second.headers['content-type'], 'application/json; charset=utf-8');
				assert.equal(second.headers['last-modified'], new Date('2017-01-02').toUTCString());
				assert.deepStrictEqual(second.data, { pages: [ {
					id: add.data.id,
					name: 'this is test',
					modified: new Date('2017-01-01').getTime() / 1000.0,
					accessed: new Date('2017-01-02').getTime() / 1000.0,
					public: false,
				}] });

				const remove = await axios.delete(ORIGIN + add.headers['location']);
				assert.equal(remove.status, 200);
				assert.equal(remove.headers['content-type'], 'application/json; charset=utf-8');
				assert.deepStrictEqual(remove.data, {});

				const third = await axios.get(ORIGIN + '/v1/pages');
				assert.equal(third.status, 200);
				assert.equal(third.headers['content-type'], 'application/json; charset=utf-8');
				assert.deepStrictEqual(third.data, { pages: [] });
			});

			it('get contents', async () => {
				const add = await axios.post(ORIGIN + '/v1/create', {
					markdown: '# this is test\ntest markdown',
					modified: new Date('2017-01-01').getTime() / 1000.0,
					accessed: new Date('2017-01-02').getTime() / 1000.0,
				});
				assert.equal(add.status, 201);

				const markdown = await axios.get(ORIGIN + '/' + add.data.id + '.md');
				assert.equal(markdown.status, 200);
				assert.equal(markdown.headers['content-type'], 'text/markdown; charset=utf-8');
				assert.equal(markdown.headers['last-modified'], new Date('2017-01-01').toUTCString());
				assert.strictEqual(markdown.data, '# this is test\ntest markdown');

				const html = await axios.get(ORIGIN + '/' + add.data.id + '.html');
				assert.equal(html.status, 200);
				assert.equal(html.headers['content-type'], 'text/html; charset=utf-8');
				assert.equal(html.headers['last-modified'], new Date('2017-01-01').toUTCString());
				const remove = await axios.delete(ORIGIN + add.headers['location']);
				assert.equal(remove.status, 200);
			});

			it('update', async () => {
				const add = await axios.post(ORIGIN + '/v1/create', {
					markdown: '# this is test\ntest markdown',
					modified: new Date('2017-01-01').getTime() / 1000.0,
					accessed: new Date('2017-01-02').getTime() / 1000.0,
				});
				assert.equal(add.status, 201);

				const patch = await axios.patch(ORIGIN + add.headers['location'], {
					markdown: '# new content',
					modified: new Date('2017-02-01').getTime() / 1000.0,
					accessed: new Date('2017-02-02').getTime() / 1000.0,
				});
				assert.equal(patch.status, 200);
				assert.equal(patch.headers['content-type'], 'application/json; charset=utf-8');
				assert.deepStrictEqual(patch.data, {})

				const get = await axios.get(ORIGIN + add.headers['location']);
				assert.equal(get.status, 200);
				assert.equal(get.headers['last-modified'], new Date('2017-02-02').toUTCString());
				assert.strictEqual(get.data.markdown, '# new content');
				assert.equal(get.data.modified, new Date('2017-02-01').getTime() / 1000.0);
				assert.equal(get.data.accessed, new Date('2017-02-02').getTime() / 1000.0);

				try {
					await axios.patch(ORIGIN + add.headers['location'], {
						modified: new Date('2017-01-01').getTime() / 1000.0,
					});
				} catch (e) {
					assert.equal(e.response.status, 409);
					assert.equal(e.response.headers['content-type'], 'application/json; charset=utf-8');
				}

				const remove = await axios.delete(ORIGIN + add.headers['location']);
				assert.equal(remove.status, 200);
			});
		});
	});
});
