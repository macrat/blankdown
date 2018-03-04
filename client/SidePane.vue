<style scoped>
nav {
	padding: .5em;
}

nav > div {
	padding-bottom: .5em;
	margin-bottom: .5em;
	border-bottom: 1px solid white;
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
					:class="{ 'file-noname': file.markdown.split('\n')[0].trim() === '', 'file-current': $store.state.current && file.ID === $store.state.current.ID }">

					<a
						class=file-name
						draggable=false
						@click.prevent="$store.dispatch('open', file.ID)"
						:href="'/' + file.ID">{{ file.markdown.split('\n')[0] || 'no name' }}</a>

					<a
						class=file-remove
						draggable=false
						href
						@click.prevent="$store.dispatch('remove', file.ID)">remove</a>
				</div>
			</div>
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
			filtered: null,
			currentFilter: '',
			searchWord: '',
		};
	},
	computed: {
		files() {
			return this.filtered !== null ? this.filtered : this.$store.state.files;
		},
	},
	methods: {
		update() {
			const query = this.searchWord.trim();
			if (this.currentFilter === query) {
				return;
			}

			if (!query) {
				this.$store.dispatch('loadFiles');
			} else {
				this.$store.dispatch('search', query);
			}
		},
	},
};
</script>
