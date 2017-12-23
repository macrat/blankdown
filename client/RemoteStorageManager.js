import Vue from 'vue';

import APIClient from './APIClient.js';


function remote_to_local(page) {
	return {
		id: page.id,
		name: page.name,
		markdown: page.markdown,
		readonly: page.public,
		modified: page.modified,
		accessed: page.accessed,
	};
}


export default new Vue({
	name: 'RemoteStorage',
	computed: {
		client() {
			const client = new APIClient();
			client.on('saved', this.changedPages);
			client.on('created', this.changedPages);
			client.on('removed', this.changedPages);
			client.on('mark-access', this.changedPages);
			return client;
		},
	},
	methods: {
		changedPages() {
			this.client.getFiles().then(files => {
				this.$emit('changed-pages', files);
			}).catch(console.error);
		},

		async pages() {
			return await this.client.getFiles();
		},

		async load(id) {
			return await this.client.load(id);
		},

		async loadMostRecent() {
			return await this.client.loadMostRecent();
		},

		async save(id, page) {
			if (!page.markdown) {
				return await this.client.remove(id);
			} else {
				return await this.client.save(page);
			}
		},

		async create(markdown='') {
			return await this.client.create(markdown);
		},

		async remove(id) {
			return await this.client.remove(id);
		},

		async markAccess(id, timestamp=null) {
			return await this.client.markAccess(id, timestamp);
		},
	},
});
