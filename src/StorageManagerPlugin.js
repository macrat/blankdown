import Vue from 'vue';
import { debounce } from 'lodash-es';

import storage from './RemoteStorageManager.js';


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
	async function load_data(id) {
		if (!id) {
			return;
		}

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

		const data = await storage.load(id);
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

	async function save_current(state) {
		if (!state.current.readonly) {
			const timestamp = new Date().getTime() / 1000.0;
			await storage.save(state.current.id, {
				id: state.current.id,
				markdown: state.current.markdown,
				accessed: timestamp,
				modified: timestamp,
			});
		}
	}

	const autosave = debounce(() => {
		store.dispatch('save');
	}, 1000);

	store.subscribeAction((action, state) => {
		switch (action.type) {
		case 'save':
			save_current(state).then(() => {
				store.commit('saved');
			});
			break;

		case 'load':
			save_current(state).then(() => load_data(action.payload));
			break;

		case 'create':
			storage.create().then(page => {
				store.commit('created', page)
			});
			break;

		case 'remove':
			storage.remove(state.current.id).then(() => {
				store.commit('removed', state.current);

				storage.loadMostRecent().then(next => {
					if (!next) {
						store.dispatch('create');
					} else {
						store.commit('loaded', {
							id: next.id,
							markdown: next.markdown,
							readonly: next.readonly,
						});
					}
				});
			});
			break;

		case 'update':
			autosave();
			break;

		case 'import':
			storage.create().then(page => store.commit('loaded', page));
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

	storage.pages().then(pages => store.commit('changed_recent_files', pages));
	storage.$on('changed-pages', pages => store.commit('changed_recent_files', pages));

	let id = (async function() {
		const pathes = ((await storage.pages()) || []).map(x => x.id);
		if (location.pathname.slice(1) in pathes) {
			pathes.unshift(location.pathname.slice(1));
		}
		for (let id of pathes) {
			if (await load_data(id)) {
				return id;
			}
		}
		return null;
	})();

	const loaded = id !== null;

	if (!loaded) {
		storage.create().then(page => store.commit('created', page));
	}

	if (location.pathname.slice(1) !== id) {
		if (loaded) {
			history.replaceState(null, '', '/' + id + location.search);
		} else {
			history.pushState(null, '', '/' + id + location.search);
		}
	}
};
