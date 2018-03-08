import assert from 'power-assert';

import {findTags} from '../client/tags';


describe('client', () => {
	describe('tags', () => {
		describe('findTags', () => {
			it('simple', () => {
				const markdown = '#first-tag\nthis is #tag\n#tag_line #japanese_タグ\t#tab.tag\r#include#sharp';
				const tags = findTags(markdown);

				assert.deepStrictEqual(tags, new Set(['first-tag', 'tag', 'tag_line', 'japanese_タグ', 'tab.tag', 'include#sharp']));
			});

			it('no tag', () => {
				assert.deepStrictEqual(findTags('hello! this is test\nhello world\nhello world'), new Set());
			});

			it('empty string', () => {
				assert.deepStrictEqual(findTags(''), new Set());
			});

			it('tag only', () => {
				assert.deepStrictEqual(findTags('#tag'), new Set(['tag']));
			});
		});
	});
});
