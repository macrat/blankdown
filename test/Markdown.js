import assert from 'power-assert';

import Markdown from '../common/Markdown.mjs';


describe('common', () => {
	describe('Markdown', () => {
		it('toHTML', () => {
			const html = Markdown.toHTML(`# this is test

hello **world**

paragraph`);

			assert.strictEqual(html, `<h1 id="this-is-test"><a name="this is test" class="anchor" href="#this-is-test">this is test</a></h1><p>hello <strong>world</strong></p>
<p>paragraph</p>
`);
		});

		it('getTOCBy', () => {
			const toc = Markdown.getTOCBy(`# h1
## h2
## h2.2
### h3
## h2.3
#### h4
# h1.2`);

			assert.deepStrictEqual(toc, ['h1', ['h2', 'h2.2', ['h3'], 'h2.3', [['h4']]], 'h1.2']);
		});

		it('getNameBy', () => {
			const name1 = Markdown.getNameBy('# this is test');
			assert.strictEqual(name1, 'this is test');

			const name2 = Markdown.getNameBy('hello world\ndocument\n');
			assert.strictEqual(name2, 'hello world');

			const name3 = Markdown.getNameBy('### title #\nbody');
			assert.strictEqual(name3, 'title #');
		});
	});
});
