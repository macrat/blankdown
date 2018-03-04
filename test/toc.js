import assert from 'power-assert';

import {parseTOC, toc2html, makeTOCHTML} from '../client/toc';


describe('client', () => {
	describe('toc', () => {
		describe('parseTOC', () => {
			it('one line', () => {
				const toc = parseTOC(`# h1
another
## h2
#tag
## h2.2
this is # dummy
### h3
## h2.3
#### h4
# h1.2`);

				assert.deepStrictEqual(toc, ['h1', ['h2', 'h2.2', ['h3'], 'h2.3', [['h4']]], 'h1.2']);
			});

			it('multi line', () => {
				const toc = parseTOC(`header
===

not header
--

h
-

not header
- - - - - -

header
======
======
======

---
----
-----
`);
				assert.deepStrictEqual(toc, ['header', ['h'], 'header', '======', ['---']]);
			});
		});

		describe('toc2html', () => {
			it('empty', () => {
				assert(toc2html([]) === '<ul></ul>');
			});

			it('escape', () => {
				assert(toc2html(['hello world']) === '<ul><li><a href="#hello-world">hello world</a></li></ul>');
				assert(toc2html(['<p>']) === '<ul><li><a href="#-p-">&lt;p&gt;</a></li></ul>');
			});

			it('sub section', () => {
				assert(toc2html([[[[['foobar']]]]]) === '<ul><ul><ul><ul><ul><li><a href="#foobar">foobar</a></li></ul></ul></ul></ul></ul>');
			});
		});

		it('makeTOCHTML', () => {
			const html = makeTOCHTML(`
# abc
## def
# ghi
### jkl
# mno
# pqr stu`);

			assert(html === '<ul><li><a href="#abc">abc</a></li><ul><li><a href="#def">def</a></li></ul><li><a href="#ghi">ghi</a></li><ul><ul><li><a href="#jkl">jkl</a></li></ul></ul><li><a href="#mno">mno</a></li><li><a href="#pqr-stu">pqr stu</a></li></ul>');
		});
	});
});
