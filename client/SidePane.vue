<style scoped>
nav {
	border-right : 1px solid black;
	padding: .5em;
	width: 12em;
}

div {
	display: flex;
	align-items: center;
	padding-bottom: .5em;
	margin-bottom: .5em;
	border-bottom: 1px solid gray;
}

img {
	width: 2em;
	height: 2em;
}

#username {
	margin-left: .5em;
}

input {
	display: block;
	width: 100%;
}

a {
	display: block;
	line-height: 2em;
	color: black;
	text-decoration: none;
}
</style>

<template>
	<nav>
		<div>
			<img :src=user.icon align=middle>
			<span id=username>{{ user.name }}</span>
		</div>

		<input
			type=search
			placeholder=search
			v-model=searchWord
			@keyup=update
			@change=update>

		<a
			v-for="file in files"
			@click.prevent="$store.dispatch('load', file.id)">{{ file.name }}</a>
	</nav>
</template>

<script>
import axios from 'axios';


export default {
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
