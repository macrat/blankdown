import Vue from 'vue';


export default new Vue({
	methods: {
		pages() {
			return (JSON.parse(localStorage.getItem('state::recent_pages')) || []).filter(x => this.getBody(x.id));
		},

		getMetadata(id) {
			return this.pages().filter(x => x.id === id)[0];
		},

		getBody(id) {
			return localStorage.getItem('page::' + id);
		},

		load(id) {
			const metadata = this.getMetadata(id);
			if (!metadata) {
				return null;
			}
			return Object.assign({ markdown: this.getBody(id) }, metadata);
		},

		loadMostRecent() {
			const most_recent = this.pages()[0];
			if (!most_recent) {
				return null;
			}
			return this.load(most_recent.id);
		},

		save(id, page) {
			if (!page.markdown) {
				this.remove(id);
				return;
			}

			const pages = this.pages().filter(x => x.id !== id);
			pages.unshift({
				id: page.id,
				name: page.name,
				readonly: page.readonly,
				modified: page.modified,
				accessed: page.accessed,
			});

			localStorage.setItem('page::' + id, page.markdown);
			localStorage.setItem('state::recent_pages', JSON.stringify(pages));

			this.$emit('changed-pages', pages);
		},

		remove(id) {
			const pages = JSON.stringify(this.pages().filter(x => x.id !== id));

			localStorage.setItem('state::recent_pages', pages);
			localStorage.removeItem('page::' + id);

			this.$emit('changed-pages', pages);
		},

		markAccess(id, timestamp=null) {
			const metadata = this.getMetadata(id);
			if (!metadata) {
				return;
			}

			const pages = this.pages().filter(x => x.id !== id);
			pages.unshift(Object.assign(metadata, {
				accessed: timestamp || (new Date().getTime() / 1000.0),
			}));

			localStorage.setItem('state::recent_pages', JSON.stringify(pages));

			this.$emit('changed-pages', pages);
		},
	},
});
