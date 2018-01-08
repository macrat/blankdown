import Vue from 'vue';
import Vuex from 'vuex';
import debounce from 'lodash/debounce';

import Markdown from '../common/Markdown.js';

import APIClient from './APIClient.js';
import Auth from './Auth.js';

Vue.use(Vuex);


const welcomeDocument = `# welcome to blankdown

This is yet yet yet another **markdown** editor.
`;


const client = new APIClient(null);
const auth = new Auth(AUTH0_CLIENT_ID, AUTH0_DOMAIN);


auth.on('login', token => {
	const profile = auth.profile;
	if (profile) {
		store.commit('loggedin', {
			name: profile.name,
			icon: profile.picture,
			token: token,
		});
	}
});
auth.on('error', error => {
	alert('failed to login');
	console.error(error);
});


async function load_data(id) {
	if (!id) {
		return;
	}

	const data = await client.load(id);
	if (data) {
		if (!data.readonly) {
			await client.markAccess(id);
		}

		store.commit('loaded', {
			id: id,
			markdown: data.markdown,
			readonly: data.readonly,
		});
		return true;
	}

	return false;
}


async function save(file) {
	if (!file.readonly) {
		const timestamp = new Date().getTime() / 1000.0;
		await client.save({
			id: file.id,
			markdown: file.markdown,
			accessed: timestamp,
			modified: timestamp,
		});
	}
}


const autosave = debounce(() => {
	store.dispatch('save');
}, 5000);


const store = new Vuex.Store({
	plugins: [
		async store => {
			window.addEventListener('beforeunload', () => {
				store.dispatch('save');
			});

			client.getFiles().then(files => store.commit('changed_recent_files', files));

			client.on('changed-files', files => store.commit('changed_recent_files', files));

			const pathes = ((await client.getFiles()) || []).map(x => x.id);
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

			client.create(welcomeDocument).then(page => {
				history.pushState(null, '', '/' + page.id + location.search);
				store.commit('created', page);
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
		user: null,
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
		loggedin(state, profile) {
			state.user = profile;
			client.jwt = profile.token;
		},
		loggedout(state) {
			state.user = null;
		},
	},
	actions: {
		create() {
			client.create().then(file => {
				this.commit('created', file)
			});
		},
		import(context, markdown) {
			client.create(markdown).then(file => store.commit('loaded', file));
		},
		update(context, markdown) {
			autosave();
			this.commit('updated', markdown);
		},
		save(context) {
			this.commit('start_save');
			save(context.state.current).then(() => {
				this.commit('saved');
			});
		},
		load(context, id) {
			save(context.state.current).then(() => load_data(id));
		},
		remove(context, id) {
			client.load(id).then(target => {
				const removeCurrent = target.id === context.state.current.id;

				client.remove(target.id).then(() => {
					this.commit('removed', target);

					if (removeCurrent) {
						client.loadMostRecent().then(next => {
							if (!next) {
								this.dispatch('create');
							} else {
								this.commit('loaded', {
									id: next.id,
									markdown: next.markdown,
									readonly: next.readonly,
								});
							}
						});
					}
				});
			});
		},
		restore(context, file) {
			client.create(file.markdown).then(file => {
				store.commit('restored', file);
			});
		},
		checkLoggedIn() {
			auth.checkLoggedIn();
		},
		login() {
			auth.login();
		},
		logout() {
			auth.logout();
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
		currentHTML(state) {
			return client.getHTML(state.current.id);
		}
	},
});


export default store;
