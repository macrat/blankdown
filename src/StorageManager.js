import Vue from 'vue';
import { debounce } from 'lodash-es';


const shortcuts_document = `# Shortcuts

## main menu
|key combination|what do                          |
|:--------------|:--------------------------------|
|Alt-F          |Open [FILE pane](/shortcuts?file)|
|Alt-H          |Open [HELP pane](/shortcuts?help)|
|Escape         |Close side pane                  |

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


export default store => {
	function save_data(file) {
		if (!file.readonly) {
			localStorage.setItem('file::' + file.id, JSON.stringify({
				markdown: file.markdown,
			}));
		}
	}

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
			return 'document';
		}

		const data = JSON.parse(localStorage.getItem('file::' + id));
		if (data) {
			store.commit('loaded', {
				id: id,
				markdown: data.markdown,
				readonly: false,
			});
			return 'normal';
		}

		return null;
	}

	const autosave = debounce(() => {
		store.dispatch('save');
	}, 1000);

	store.subscribeAction((action, state) => {
		switch (action.type) {
		case 'save':
			if (state.current.markdown) {
				save_data(state.current);
				store.commit('push_recent_file', state.current);
				Vue.nextTick(() => {
					store.commit('saved');
				});
			}
			break;

		case 'load':
			save_data(state.current);
			load_data(action.payload);
			break;

		case 'create':
			store.commit('created', {
				id: (new Date()).getTime().toString(36),
				markdown: '',
				readonly: false,
			});
			break;

		case 'remove':
			localStorage.removeItem('file::' + state.current.id);
			store.commit('remove_recent_file', state.current);
			store.commit('removed', state.current);
			for (let i=0; i<state.recent.length; i++) {
				const data = JSON.parse(localStorage.getItem('file::' + state.recent[i].id));
				if (data) {
					store.commit('loaded', {
						id: state.recent[i].id,
						markdown: data.markdown,
						readonly: false,
					});
					return;
				}
			}
			store.dispatch('create');
			break;

		case 'update_markdown':
			store.commit('push_recent_file', state.current);
			autosave();
			break;

		case 'import_markdown':
			store.commit('loaded', {
				id: (new Date()).getTime().toString(36),
				markdown: action.payload,
				readonly: false,
			});
			break;
		}
	});

	store.subscribe((mutation, state) => {
		switch (mutation.type) {
		case 'changed_recent_files':
		case 'push_recent_file':
		case 'remove_recent_file':
			const recent = state.recent.filter(x => localStorage.getItem('file::' + x.id) != null);
			localStorage.setItem('state::recent_files', JSON.stringify(recent));
			break;

		case 'created':
		case 'loaded':
		case 'restored':
			if (!mutation.payload.readonly && mutation.payload.id) {
				store.commit('push_recent_file', mutation.payload);
			}
			break;
		}
	});

	store.commit('changed_recent_files', JSON.parse(localStorage.getItem('state::recent_files')) || []);

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

	Vue.nextTick(() => {
		store.dispatch('save');
	});

	window.addEventListener('beforeunload', () => {
		store.dispatch('save');
	});
};
