<template>
	<div>
		<nav-button @click="$emit('click'); $store.dispatch('create')">new</nav-button>
		<nav-button @click="$emit('click'); $emit('open-file')">open</nav-button>
		<nav-button @click="$emit('click'); $store.dispatch('save')">save</nav-button>
		<nav-button @click="$emit('click'); $store.dispatch('remove')">remove</nav-button>
		<hr>
		<nav-button @click="$emit('click'); $refs.importAndExporter.$emit('import')">import</nav-button>
		<nav-button @click="$emit('click'); $refs.importAndExporter.$emit('export-markdown')">export as markdown</nav-button>
		<nav-button @click="$emit('click'); $refs.importAndExporter.$emit('export-html')">export as HTML</nav-button>
		<hr>
		<nav-button
			v-for="file in $store.state.recent"
			:key=file.id
			@click="$emit('click'); $store.dispatch('load', file.id)"
			:disabled="file.id === $store.state.current.id"
			:href="'/' + file.id">{{ file.name }}</nav-button>

		<import-and-exporter ref=importAndExporter />
	</div>
</template>

<script>
import NavButton from './NavButton.vue';
import ImportAndExporter from './ImportAndExporter.vue';


export default {
	components: {
		NavButton: NavButton,
		ImportAndExporter: ImportAndExporter,
	},
	created() {
		window.addEventListener('keydown', ev => {
			if (ev.ctrlKey && ev.shiftKey) {
				switch (ev.key) {
				case 's':
					ev.preventDefault();
					this.$refs.importAndExporter.$emit('export-markdown');
					break;

				case 'o':
					ev.preventDefault();
					this.$refs.importAndExporter.$emit('import');
					break;
				}
			}
		});
	},
};
</script>
