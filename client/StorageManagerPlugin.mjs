import Vue from 'vue';
import { debounce } from 'lodash-es';

import storage from './RemoteStorageManager.mjs';


const welcomeDocument = `# welcome to blankdown

This is yet yet yet another **markdown** editor.
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

	(async function() {
		const pathes = ((await storage.pages()) || []).map(x => x.id);
		if (location.pathname.slice(1) in pathes) {
			pathes.unshift(location.pathname.slice(1));
		}
		for (let id of pathes) {
			if (await load_data(id)) {
				if (location.pathname.slice(1) !== id) {
					history.replaceState(null, '', '/' + id + location.search);
				}
				return id;
			}
		}

		storage.create(welcomeDocument).then(page => {
			history.pushState(null, '', '/' + page.id + location.search);
			store.commit('created', page);
		});
	})();

};
