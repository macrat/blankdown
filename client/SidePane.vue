<style scoped>
nav {
	padding: .5em;
}

#profile {
	display: flex;
	align-items: center;
}

nav > div {
	padding-bottom: .5em;
	margin-bottom: .5em;
	border-bottom: 1px solid white;
}

img {
	width: 2em;
	height: 2em;
}

#username {
	margin-left: .5em;
	font-size: 120%;
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
	<drawer-view>
		<nav>
			<div id=profile>
				<img :src=user.icon align=middle>
				<span id=username>{{ user.name }}</span>
			</div>

			<div>
				<a href @click.prevent="$store.dispatch('create')">new</a>
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

import DrawerView from './DrawerView.vue';


export default {
	components: { DrawerView },
	data() {
		return {
			user: {
				name: 'user name',
				icon: '',
			},
			filtered: null,
			currentFilter: '',
			searchWord: '',
		};
	},
	computed: {
		files() {
			return this.filtered !== null ? this.filtered : this.$store.state.recent;
		},
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
	},
};
</script>
