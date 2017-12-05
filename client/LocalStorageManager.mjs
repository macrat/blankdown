import Vue from 'vue';
import generateUUID from 'uuid/v4';

import documents from '../common/documents.mjs';
import Markdown from '../common/Markdown.mjs';


export default new Vue({
	name: 'LocalStorage',
	methods: {
		async pages() {
			return (JSON.parse(localStorage.getItem('state::recent_pages')) || []).filter(x => this.getBody(x.id));
		},

		async getMetadata(id) {
			return (await this.pages()).filter(x => x.id === id)[0];
		},

		getBody(id) {
			return localStorage.getItem('page::' + id);
		},

		async load(id) {
			if (id in documents) {
				return {
					id: id,
					name: Markdown.getNameBy(documents[id]),
					markdown: documents[id],
					readonly: true,
					accessed: null,
					modified: null,
				}
			}

			const metadata = await this.getMetadata(id);
			if (!metadata) {
				return null;
			}
			return Object.assign({ markdown: this.getBody(id) }, metadata);
		},

		async loadMostRecent() {
			for (const page of (await this.pages() || [])) {
				const data = await this.load(page.id);
				if (data) {
					return data;
				}
			}
			return null;
		},

		async save(id, page) {
			if (!page.markdown) {
				await this.remove(id);
				return;
			}

			const pages = (await this.pages()).filter(x => x.id !== id);
			pages.unshift({
				id: page.id,
				name: Markdown.getNameBy(page.markdown),
				modified: page.modified,
				accessed: page.accessed,
			});

			localStorage.setItem('page::' + id, page.markdown);
			localStorage.setItem('state::recent_pages', JSON.stringify(pages));

			this.$emit('changed-pages', pages);
		},

		async create(markdown='') {
			const timestamp = new Date().getTime() / 1000.0;
			const page = {
				id: generateUUID(),
				name: Markdown.getNameBy(markdown),
				markdown: markdown,
				modified: timestamp,
				accessed: timestamp,
			};

			await this.save(page.id, page);

			return page;
		},

		async remove(id) {
			const pages = (await this.pages()).filter(x => x.id !== id);

			localStorage.setItem('state::recent_pages', JSON.stringify(pages));
			localStorage.removeItem('page::' + id);

			this.$emit('changed-pages', pages);
		},

		async markAccess(id, timestamp=null) {
			const metadata = await this.getMetadata(id);
			if (!metadata) {
				return;
			}

			const pages = (await this.pages()).filter(x => x.id !== id);
			pages.unshift(Object.assign(metadata, {
				accessed: timestamp || (new Date().getTime() / 1000.0),
			}));

			localStorage.setItem('state::recent_pages', JSON.stringify(pages));

			this.$emit('changed-pages', pages);
		},
	},
});
