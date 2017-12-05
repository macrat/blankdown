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
	methods: {
		async pages() {
			return ((await axios.get('/v1/pages')).data.pages || []).map(remote_to_local).filter(x => x.name !== "");
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
			const most_recent = await this.pages()[0];
			if (!most_recent) {
				return null;
			}
			return await this.load(most_recent.id);
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
