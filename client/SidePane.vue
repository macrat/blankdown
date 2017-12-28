<style scoped>
nav {
	padding: .5em;
}

nav > div {
	padding-bottom: .5em;
	margin-bottom: .5em;
	border-bottom: 1px solid white;
}

#profile {
	display: flex;
	align-items: center;
}
#profile img {
	width: 2em;
	height: 2em;
}
#username {
	margin-left: .5em;
	flex: 1 1 0;
}

input {
	display: block;
	background-color: #c8d3de;
	width: 100%;
	padding: .5em .3em;
	margin-bottom: .5em;
	border: none;
}

a {
	display: block;
	line-height: 2em;
	color: white;
	text-decoration: none;
}

a:focus {
	outline: none;
	background-color: lightslategray;
}

.file-remove {
	font-size: 80%;
	color: #eee;
}
.file {
	display: flex;
	width: 100%;
}
.file-name {
	flex: 1 1 0;
}
.file-current {
	background-color: #596b7d;
}
.file-noname .file-name {
	color: #aaa;
}
</style>

<template>
	<drawer-view @open=$refs.newbutton.focus()>
		<nav>
			<div id=profile v-if=$store.state.user>
				<img :src=$store.state.user.icon>
				<a id=username href @click.prevent=logout>{{ $store.state.user.name }}</a>
			</div>
			<div id=profile v-else>
				<img src="/icon.svg">
				<a id=username a href @click.prevent=login>login</a>
			</div>

			<div>
				<a href @click.prevent="$store.dispatch('create')" ref=newbutton>new</a>
				<a href @click.prevent="$emit('import-request')">import</a>
				<a href @click.prevent="$emit('export-request', 'markdown')">export</a>
				<a href @click.prevent="$emit('export-request', 'html')">export as HTML</a>
			</div>

			<input
				type=search
				placeholder=search
				v-model=searchWord
				@keyup=update
				@change=update>

			<div id=file-list>
				<div
					class=file
					v-for="file in files"
					:class="{ 'file-noname': file.name.trim() === '', 'file-current': file.id === $store.state.current.id }">

					<a
						class=file-name
						draggable=false
						@click.prevent="$store.dispatch('load', file.id)"
						:href="'/' + file.id">{{ file.name || 'no name' }}</a>

					<a
						class=file-remove
						draggable=false
						href
						@click.prevent="$store.dispatch('remove', file.id)">remove</a>
				</div>
			</div>

			<a href="/about" draggable=false @click.prevent="$store.dispatch('load', 'about')">about</a>
			<a href="/shortcuts" draggable=false @click.prevent="$store.dispatch('load', 'shortcuts')">shortcuts</a>
		</nav>
	</drawer-view>
</template>

<script>
import axios from 'axios';

import Auth from './Auth.js';
import DrawerView from './DrawerView.vue';


export default {
	components: { DrawerView },
	data() {
		return {
			filtered: null,
			currentFilter: '',
			searchWord: '',
		};
	},
	computed: {
		files() {
			return this.filtered !== null ? this.filtered : this.$store.state.recent;
		},
		auth() {
			return new Auth(AUTH0_CLIENT_ID, AUTH0_DOMAIN);
		},
	},
	created() {
		this.auth.on('login', token => {
			const profile = this.auth.profile;
			if (profile) {
				this.$store.commit('loggedin', {
					name: profile.name,
					icon: profile.picture,
					token: token,
				});
			}
		});
		this.auth.on('error', error => {
			alert('failed to login');
			console.error(error);
		});
		this.auth.checkLoggedIn();
	},
	methods: {
		update() {
			const query = this.searchWord.trim();
			if (this.currentFilter === query) {
				return;
			}

			if (!query) {
				this.currentFilter = query;
				this.filtered = null;
				return;
			}

			axios.get('/v1/search', { params: { q: query } })
				.then(response => {
					this.currentFilter = query;
					this.filtered = response.data.result;
				})
				.catch(console.error)
		},
		login() {
			this.auth.login();
		},
		logout() {
			this.auth.logout();
		},
	},
};
</script>
