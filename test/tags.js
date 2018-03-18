import assert from 'power-assert';

import {findTags, makeTagTree} from '../client/tags';


describe('client', () => {
	describe('tags', () => {
		describe('findTags', () => {
			it('simple', () => {
				const markdown = '#first-tag\nthis is #tag\n#tag_line #japanese_タグ\t#tab.tag\r#include#sharp word#in-tag-like\n## heading\n';
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

		describe('makeTagTree', function() {
			it('flat', function() {
				assert.deepStrictEqual(
					makeTagTree([['hoge', 1], ['fuga', 2], ['foo', 4], ['bar', 6]]),
					new Map([
						['hoge', {num: 1, children: new Map()}],
						['fuga', {num: 2, children: new Map()}],
						['foo', {num: 4, children: new Map()}],
						['bar', {num: 6, children: new Map()}],
					]),
				);
			});

			it('single nest', function() {
				assert.deepStrictEqual(
					makeTagTree([['hoge', 3], ['fuga', 2], ['hoge/aa', 1], ['foo/bb', 4]]),
					new Map([
						['hoge', {num: 4, children: new Map([
							['aa', {num: 1, children: new Map()}],
						])}],
						['fuga', {num: 2, children: new Map()}],
						['foo', {num: 4, children: new Map([
							['bb', {num: 4, children: new Map()}],
						])}],
					]),
				);
			});

			it('deep nest', function() {
				assert.deepStrictEqual(
					makeTagTree([['foo/bar/baz/foobar', 2], ['foo/bar/hoge', 40]]),
					new Map([
						['foo', {num: 42, children: new Map([
							['bar', {num: 42, children: new Map([
								['baz', {num: 2, children: new Map([
									['foobar', {num: 2, children: new Map()}],
								])}],
								['hoge', {num: 40, children: new Map()}],
							])}],
						])}],
					]),
				);
			});
		});
	});
});
