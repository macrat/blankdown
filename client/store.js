import Vue from 'vue';
import Vuex from 'vuex';
import IndexedFTS from 'indexedfts';
import debounce from 'lodash/debounce';
import uuid from 'uuid/v4';

import {makeTOCHTML} from './toc';

Vue.use(Vuex);


const welcomeDocument = `# welcome to blankdown

This is yet yet yet another **markdown** editor.
`;


const db = new IndexedFTS('blankdown', 1, {
	ID: 'primary',
	markdown: 'fulltext',
	updated: {},
});


const saveReserve = debounce(() => {
	store.dispatch('save', store.state.current);
}, 100);


const store = new Vuex.Store({
	plugins: [
		async store => {
			window.addEventListener('beforeunload', () => store.dispatch('save', store.state.current));

			store.subscribe((action, state) => {
				if (action === 'files-changed') {
					if (state.files.length === 0) {
						store.dispatch('create', welcomeDocument);
					}
				}
			});

			await db.open();
			await store.dispatch('loadFiles');
		},
	],
	state: {
		current: null,
		files: [],
	},
	getters: {
		currentName(state) {
			return state.current ? state.current.markdown.split('\n')[0] : '';
		},
		currentTOC(state) {
			return state.current ? makeTOCHTML(state.current.markdown) : '';
		},
	},
	mutations: {
		saved(state, file) {
			for (const f of state.files) {
				if (f.ID === file.ID) {
					f.saved = true;
					break;
				}
			}
		},
		'files-changed': function(state, files) {
			state.files = files;
		},
		openIndex(state, index) {
			this.dispatch('save', state.current);
			state.current = state.files[index];
		},
		open(state, id) {
			this.dispatch('save', state.current);
			state.current = state.files.filter(x => x.ID === id)[0];
		},
		updated(state, markdown) {
			state.current.markdown = markdown;
			state.current.updated = new Date();
			state.current.saved = false;

			state.files.sort((x, y) => {
				if (x.updated > y.updated) {
					return -1;
				} else if (x.updated < y.updated) {
					return 1;
				} else {
					return 0;
				}
			});
		},
	},
	actions: {
		save(context, file) {
			if (file && !file.saved) {
				db.put({
					ID: file.ID,
					markdown: file.markdown,
					updated: file.updated.getTime(),
				})
				.then(() => context.commit('saved', file))
				.catch(console.error)
			}
		},
		async loadFiles(context) {
			context.dispatch('save', context.state.current);

			const files = await db.sort('updated', 'desc');
			context.commit('files-changed', files.map(x => ({
				ID: x.ID,
				markdown: x.markdown,
				updated: new Date(x.updated),
				saved: true,
			})));
		},
		async search(context, query) {
			if (!query) {
				context.dispatch('loadFiles');
				return;
			}
			context.dispatch('save', context.state.current);

			const files = await db.search('markdown', query);
			context.commit('files-changed', files.map(x => ({
				ID: x.ID,
				markdown: x.markdown,
				updated: new Date(x.updated),
				saved: true,
			})));
		},
		async create(context, markdown='') {
			const data = {
				ID: uuid(),
				markdown: markdown,
				updated: new Date(),
				saved: true,
			};

			await db.put({
				ID: data.ID,
				markdown: data.markdown,
				updated: data.updated.getTime(),
			});

			const files = context.state.files.concat(data);
			files.sort((x, y) => {
				if (x.updated > y.updated) {
					return -1;
				} else if (x.updated < y.updated) {
					return 1;
				} else {
					return 0;
				}
			});
			context.commit('files-changed', files);
			context.commit('open', data.ID);
		},
		async remove(context, id) {
			await db.remove(id);
			context.commit('files-changed', context.state.files.filter(x => x.ID !== id));
		},
		async open(context, id) {
			for (const idx in context.state.files) {
				if (context.state.files[idx].ID === id) {
					context.commit('openIndex', idx);
					return;
				}
			}

			const files = await db.sort('updated', 'desc');
			context.commit('files-changed', files.map(x => ({
				ID: x.ID,
				markdown: x.markdown,
				updated: new Date(x.updated),
				saved: true,
			})));

			for (const idx in context.state.files) {
				if (context.state.files[idx].ID === id) {
					context.commit('openIndex', idx);
					return;
				}
			}
		},
		async update(context, markdown) {
			context.commit('updated', markdown);
			saveReserve();
		},
	},
});

export default store;
