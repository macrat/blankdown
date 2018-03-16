import Vue from 'vue';
import Vuex from 'vuex';
import IndexedFTS from 'indexedfts';
import debounce from 'lodash/debounce';
import uuid from 'uuid/v4';

import {makeTOCHTML} from './toc';
import {findTags} from './tags';

Vue.use(Vuex);


const welcomeDocument = `# welcome to blankdown

This is yet yet yet another **markdown** editor.
`;


const db = new IndexedFTS('blankdown', 1, {
	ID: 'primary',
	markdown: {fulltext: true, normal: false},
	updated: 'normal',
	tags: {word: true, normal: false},
});


const saveReserve = debounce(() => {
	store.dispatch('save', store.state.current);
}, 100);


const store = new Vuex.Store({
	plugins: [
		async store => {
			window.addEventListener('beforeunload', () => store.dispatch('save', store.state.current));

			let firstLoad = true;
			store.subscribe(ev => {
				if (firstLoad && ev.type === 'files-changed') {
					if (store.state.files.length === 0) {
						store.dispatch('create', welcomeDocument);
					}
					firstLoad = false;
				}
			});

			await db.open();
			store.commit('database-opened');
			await store.dispatch('loadFiles');
		},
	],
	state: {
		current: null,
		files: [],
		tags: [],
	},
	getters: {
		currentName(state) {
			if (!state.current) {
				return '';
			}
			const firstLine = state.current.markdown.split('\n')[0];

			const heading = /^#+[ \t]+(.*)$/.exec(firstLine);
			if (heading) {
				return heading[1].trim();
			}

			return firstLine.trim();
		},
	},
	mutations: {
		'database-opened': function() {
		},
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
		'tags-changed': function(state, tags) {
			state.tags = tags;
		},
		openIndex(state, index) {
			this.dispatch('save', state.current);
			if (index in state.files) {
				state.current = state.files[index];
			} else {
				this.commit('failed-to-open', {index});
			}
		},
		open(state, id) {
			this.dispatch('save', state.current);
			const target = state.files.filter(x => x.ID === id);
			if (target.length === 1) {
				state.current = target[0];
			} else {
				this.commit('failed-to-open', {id});
			}
		},
		'failed-to-open': function(state, info) {
		},
		close(state) {
			this.dispatch('save', state.current);
			state.current = null;
		},
		updated(state, markdown) {
			state.current.markdown = markdown;
			state.current.toc = makeTOCHTML(markdown);
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
					tags: [...findTags(file.markdown)].join(' '),
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
				toc: makeTOCHTML(x.markdown),
				updated: new Date(x.updated),
				saved: true,
			})));

			context.commit('tags-changed', [...await db.getWords('tags', {ignoreCase: true})]);
		},
		async search(context, query) {
			if (!query) {
				context.dispatch('loadFiles');
				return;
			}
			context.dispatch('save', context.state.current);

			const files = await db.search('markdown', query, {ignoreCase: true});
			context.commit('files-changed', files.map(x => ({
				ID: x.ID,
				markdown: x.markdown,
				toc: makeTOCHTML(x.markdown),
				updated: new Date(x.updated),
				saved: true,
			})));
		},
		async create(context, markdown='') {
			const data = {
				ID: uuid(),
				markdown: markdown,
				toc: makeTOCHTML(markdown),
				updated: new Date(),
				saved: false,
			};

			await context.dispatch('save',data);

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

			const tags = new Map(context.state.tags);
			findTags(data.markdown).forEach(x => {
				tags.set(x, (tags.get(x) || 0) + 1);
			});
			context.commit('tags-changed', [...tags]);
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
				toc: makeTOCHTML(x.markdown),
				updated: new Date(x.updated),
				saved: true,
			})));

			for (const idx in context.state.files) {
				if (context.state.files[idx].ID === id) {
					context.commit('openIndex', idx);
					return;
				}
			}

			context.commit('failed-to-open', {id});
		},
		async update(context, markdown) {
			const oldTags = findTags(context.state.current.markdown);

			context.commit('updated', markdown);

			const tags = new Map(context.state.tags);
			const newTags = findTags(markdown);
			newTags.forEach(x => {
				if (!oldTags.has(x)) {
					tags.set(x, (tags.get(x) || 0) + 1);
				}
			});
			oldTags.forEach(x => {
				if (!newTags.has(x)) {
					const val = (tags.get(x) || 0) - 1;
					if (val > 0) {
						tags.set(x, val);
					} else {
						tags.delete(x);
					}
				}
			});
			context.commit('tags-changed', [...tags]);

			saveReserve();
		},
		async openAddress(context, address) {
			const url = new URL(address);

			const id = url.pathname.slice(1);
			if (id && (!context.state.current || id !== context.state.current.ID)) {
				context.dispatch('open', id);
			} else {
				context.commit('close');
			}
		},
	},
});

export default store;
