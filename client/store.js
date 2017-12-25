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
		removed(state, target) {
			state.removed.id = target.id;
			state.removed.markdown = target.markdown;
			state.removed.readonly = target.readonly;
		},
		restored(state, file) {
			state.current.id = file.id;
			state.current.markdown = file.markdown;
			state.current.readonly = file.readonly;
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
		toc(state) {
			return Markdown.getTOCBy(state.current.markdown);
		},
		toc_html(state) {
			function make_html_by(toc) {
				return '<ul>' + toc.map(x => {
					if (typeof x === 'string') {
						return `<li><a href="#${x.replace(/[^\w]+/g, '-').toLowerCase()}">${ x }</a></li>`;
					} else {
						return make_html_by(x);
					}
				}).join('') + '</ul>';
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
