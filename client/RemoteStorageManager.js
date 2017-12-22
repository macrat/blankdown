import Vue from 'vue';
import axios from 'axios';


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
	methods: {
		async pages() {
			return ((await axios.get('/v1/pages')).data.pages || []).map(remote_to_local);
		},

		async load(id) {
			try {
				return remote_to_local((await axios.get(`/${id}.json`)).data);
			} catch (e) {
				console.error(e);
				return null;
			}
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

			await axios.patch(`/${id}.json`, {
				accessed: new Date().getTime() / 1000.0,
				modified: page.modified,
				markdown: page.markdown,
			});

			this.$emit('changed-pages', await this.pages());
		},

		async create(markdown='') {
			return remote_to_local(Object.assign({
				markdown: markdown
			}, (await axios.post('/v1/create', {
				markdown: markdown,
			})).data));

			this.$emit('changed-pages', await this.pages());
		},

		async remove(id) {
			await axios.delete(`/${id}.json`);

			this.$emit('changed-pages', await this.pages());
		},

		async markAccess(id, timestamp=null) {
			await axios.patch(`/${id}.json`, {
				accessed: timestamp || (new Date().getTime() / 1000.0),
			});

			this.$emit('changed-pages', await this.pages());
		},
	},
});
