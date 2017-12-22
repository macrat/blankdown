import Vue from 'vue';
import Vuex from 'vuex';

import StorageManagerPlugin from './StorageManagerPlugin.js';
import Markdown from '../common/Markdown.js';

Vue.use(Vuex);


const store = new Vuex.Store({
	plugins: [
		StorageManagerPlugin,
		store => {
			window.addEventListener('beforeunload', () => {
				store.dispatch('save');
			});
		},
	],
	state: {
		current: {
			id: null,
			markdown: '',
			readonly: true,
		},
		recent: [],
		saving: false,
		removed: {
			id: null,
			markdown: '',
			readonly: true,
		},
	},
	mutations: {
		loaded(state, data) {
			state.current.id = data.id;
			state.current.markdown = data.markdown;
			state.current.readonly = data.readonly;
		},
		changed_recent_files(state, files) {
			state.recent = files;
		},
		start_save(state) {
			state.saving = true;
		},
		saved(state) {
			state.saving = false;
		},
		updated(state, markdown) {
			state.current.markdown = markdown;
		},
		created(state, data) {
			state.current.id = data.id;
			state.current.markdown = data.markdown;
			state.current.readonly = data.readonly;
		},
		removed(state) {
			state.removed.id = state.current.id;
			state.removed.markdown = state.current.markdown;
			state.removed.readonly = state.current.readonly;

			state.current.id = null;
			state.current.markdown = '';
			state.current.readonly = true;
		},
		restored(state, file) {
			state.current.id = file.id;
			state.current.markdown = file.markdown;
			state.current.readonly = file.readonly;

			state.removed.id = null;
			state.removed.markdown = '';
			state.removed.readonly = true;
		},
	},
	actions: {
		create() {
		},
		'import': function(context, markdown) {
		},
		update(context, markdown) {
			this.commit('updated', markdown);
		},
		save() {
			this.commit('start_save');
		},
		load(context, id) {
		},
		remove(context, id) {
		},
		restore(context) {
		},
	},
	getters: {
		html(state) {
			return Markdown.toHTML(state.current.markdown);
		},
		toc(state) {
			return Markdown.getTOCBy(state.current.markdown);
		},
		toc_html(state) {
			function make_html_by(toc) {
				return '<ul>\n' + toc.map(x => {
					if (typeof x === 'string') {
						return `<li><a href="#${x.replace(/[^\w]+/g, '-').toLowerCase()}">${ x }</a></li>`;
					} else {
						return make_html_by(x);
					}
				}).join('\n') + '\n</ul>';
			}
			return make_html_by(store.getters.toc);
		},
		current_name(state) {
			return Markdown.getNameBy(state.current.markdown);
		},
		removed_name(state) {
			return Markdown.getNameBy(state.removed.markdown);
		},
	},
});


export default store;
