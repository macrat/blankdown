import Vue from 'vue';
import Vuex from 'vuex';
import marked from 'marked';
import hljs from 'highlight.js';

import StorageManagerPlugin from './StorageManagerPlugin.mjs';

Vue.use(Vuex);


marked.setOptions({
	highlight(code, lang) {
		try {
			if (lang) {
				return hljs.highlight(lang, code, true).value;
			} else {
				return hljs.highlightAuto(code).value;
			}
		} catch(e) {
			return code;
		}
	},
});


function get_name_by_markdown(markdown) {
	const idx = markdown.indexOf('\n');
	if (idx >= 0) {
		return markdown.slice(0, idx).trim().replace(/^#+ /, '').trim();
	} else {
		return markdown.trim().replace(/^#+ /, '').trim();
	}
}


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
		remove() {
		},
		restore(context) {
			this.commit('restored', context.state.removed);
		},
	},
	getters: {
		html(state) {
			return marked(state.current.markdown, {
				sanitize: true,
			});
		},
		toc(state) {
			const lexer = new marked.Lexer({ sanitize: true });
			const result = [];

			function get(stack, depth) {
				if (depth === 1) {
					return stack;
				}
				if (!stack[stack.length - 1] || !stack[stack.length - 1].push) {
					stack.push([]);
				}
				return get(stack[stack.length - 1], depth - 1);
			}

			for (var x of lexer.lex(state.current.markdown).filter(x => x.type == 'heading')) {
				get(result, x.depth).push(x.text);
			}

			return result;
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
			return get_name_by_markdown(state.current.markdown);
		},
		removed_name(state) {
			return get_name_by_markdown(state.removed.markdown);
		},
	},
});


export default store;
