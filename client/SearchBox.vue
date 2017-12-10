<style scoped>
a {
	display: block;
	color: black;
	text-decoration: none;
	border-bottom: 1px solid lightgray;
	margin: .25em 0;
	padding: .25em .5em;
}
div {
	margin: 1em;
}
</style>

<template>
	<div>
		<input type=search @keyup=update @change=update>
		<div>
			<a
				v-for="file in filtered"
				:href="'/' + file.id"
				@click.prevent="open(file.id)">{{ file.name }}</a>
		</div>
	</div>
</template>

<script>
import axios from 'axios';


export default {
	data() {
		return {
			filtered: this.$store.state.recent,
		};
	},
	mounted() {
		this.$el.querySelector('input').focus();
	},
	methods: {
		update() {
			const query = this.$el.querySelector('input').value;
			if (!query.trim()) {
				this.filtered = this.$store.state.recent;
			} else {
				axios.get('/v1/search', { params: { q: query } })
					.then(response => {
						this.filtered = response.data.result;
					})
					.catch(console.error)
			}
		},
		open(id) {
			this.$store.dispatch('load', id);
			this.$emit('file-opened', id);
		},
	},
};
</script>
