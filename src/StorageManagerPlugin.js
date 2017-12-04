import Vue from 'vue';
import { debounce } from 'lodash-es';

import storage from './LocalStorageManager.js';


const shortcuts_document = `# Shortcuts

## main menu
|key combination|what do                |
|:--------------|:----------------------|
|Alt-F          |Open [FILE pane](?file)|
|Alt-H          |Open [HELP pane](?help)|
|Escape         |Close side pane        |

## file
|key combination|what do                        |
|:--------------|:------------------------------|
|Ctrl-M         |Make new file                  |
|Ctrl-S         |Save current file              |
|Ctrl-Shift-S   |Export current file as markdown|
|Ctrl-Shift-O   |Import markdown file from disk |
`;


const about_document = `# About blankdown

not yet wrote.
`;


function get_name_by_markdown(markdown) {
	const idx = markdown.indexOf('\n');
	if (idx >= 0) {
		return markdown.slice(0, idx).trim().replace(/^#+ /, '').trim();
	} else {
		return markdown.trim().replace(/^#+ /, '').trim();
	}
}


export default store => {
	function load_data(id) {
		const readonly_document = ({
			shortcuts: shortcuts_document,
			about: about_document,
		})[id];

		if (readonly_document) {
			store.commit('loaded', {
				id: id,
				markdown: readonly_document,
				readonly: true,
			});
			return true;
		}

		const data = storage.load(id);
		if (data) {
			store.commit('loaded', {
				id: id,
				markdown: data.markdown,
				readonly: data.readonly,
			});
			return true;
		}

		return false;
	}

	function save_current(state) {
		if (!state.current.readonly) {
			storage.save(state.current.id, {
				id: state.current.id,
				name: store.getters.current_name,
				markdown: state.current.markdown,
				readonly: state.current.readonly,
				accessed: state.current.accessed,
				modified: new Date().getTime() / 1000.0,
			});
		}
	}

	const autosave = debounce(() => {
		store.dispatch('save');
	}, 1000);

	store.subscribeAction((action, state) => {
		switch (action.type) {
		case 'save':
			save_current(state);
			Vue.nextTick(() => {
				store.commit('saved');
			});
			break;

		case 'load':
			save_current(state);
			load_data(action.payload);
			break;

		case 'create':
			store.commit('created', {
				id: (new Date()).getTime().toString(36),
				name: '',
				markdown: '',
				readonly: false,
			});
			break;

		case 'remove':
			storage.remove(state.current.id);
			store.commit('removed', state.current);

			const next = storage.loadMostRecent();
			if (!next) {
				store.dispatch('create');
			} else {
				store.commit('loaded', {
					id: next.id,
					markdown: next.markdown,
					readonly: next.readonly,
				});
			}
			break;

		case 'update':
			autosave();
			break;

		case 'import':
			store.commit('loaded', {
				id: (new Date()).getTime().toString(36),
				name: get_name_by_markdown(action.payload),
				markdown: action.payload,
				readonly: false,
			});
			break;
		}
	});

	store.subscribe((mutation, state) => {
		switch (mutation.type) {
		case 'created':
		case 'loaded':
		case 'restored':
			if (!mutation.payload.readonly && mutation.payload.id) {
				storage.markAccess(mutation.payload.id);
			}
			break;
		}
	});

	store.commit('changed_recent_files', storage.pages());
	storage.$on('changed-pages', pages => store.commit('changed_recent_files', pages));

	let id;
	let loaded = false;

	for (id of [location.pathname.slice(1), ...(JSON.parse(localStorage.getItem('state::recent_files')) || []).map(x => x.id)]) {
		if (load_data(id)) {
			loaded = true;
			break;
		}
	}

	if (!loaded) {
		id = (new Date()).getTime().toString(36);
		store.commit('created', {
			id: id,
			name: 'blankdown',
			markdown:  "# blankdown\n\nThis is yet yet yet another markdown editor.\n\nYou can write **markdown** here, and save into local storage of your computer.\n",
			readonly: false,
		});
	}

	if (location.pathname.slice(1) !== id) {
		if (loaded) {
			history.replaceState(null, '', '/' + id + location.search);
		} else {
			history.pushState(null, '', '/' + id + location.search);
		}
	}
};
