import Vue from 'vue';
import axios from 'axios';


export default new Vue({
	methods: {
		async pages() {
			return ((await axios.get('/v1/pages')).data.pages || []).map(x => {
				return {
					id: x.id,
					name: x.name,
					readonly: false,
					modified: x.modified,
					accessed: x.accessed,
				};
			});
		},

		async load(id) {
			try {
				const page = (await axios.get(`/${id}.json`)).data;

				return {
					id: page.id,
					name: page.name,
					markdown: page.markdown,
					readonly: false,
					modified: page.modified,
					accessed: page.accessed,
				};
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
			const page = (await axios.post('/v1/create', {
				markdown: markdown,
			})).data;

			return {
				id: page.id,
				name: page.name,
				markdown: page.markdown,
				readonly: false,
				modified: page.modified,
				accessed: page.accessed,
			};
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
