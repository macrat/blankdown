<style scoped>
main {
	height: 100vh;
	overflow: auto;
	display: flex;
}
</style>

<style>
nav {
	flex: 0 0 auto;
}

.markdown-writer {
	flex: 1 1 0;
}
</style>

<template>
	<main :style="{ cursor: $store.state.saving ? 'progress' : 'auto' }">
		<side-pane />
		<markdown-editor ref=editor />

		<saving-indicator />
		<remove-indicator />

		<import-and-exporter ref=importAndExporter />
	</main>
</template>

<script>
import SidePane from './SidePane.vue';

import MarkdownEditor from './MarkdownEditor.vue';

import ImportAndExporter from './ImportAndExporter.vue';

import SavingIndicator from './SavingIndicator.vue';
import RemoveIndicator from './RemoveIndicator.vue';


export default {
	components: {
		SidePane: SidePane,
		MarkdownEditor: MarkdownEditor,

		ImportAndExporter: ImportAndExporter,

		SavingIndicator: SavingIndicator,
		RemoveIndicator: RemoveIndicator,
	},
	data() {
		return {
			dialogOpened: false,
			dialogContent: null,

			searchboxOpened: false,
		};
	},
	created() {
		window.addEventListener('keydown', ev => {
			if (ev.ctrlKey) {
				switch (ev.key) {
				case 'm':
					ev.preventDefault();
					this.$store.dispatch('create');
					break;
				case 'o':
					ev.preventDefault();
					this.searchboxOpened = true;
					break;
				case 's':
					ev.preventDefault();
					this.$store.dispatch('save');
					break;

				case 'O':
					ev.preventDefault();
					this.$refs.importAndExporter.$emit('import');
					break;
				case 'S':
					ev.preventDefault();
					this.$refs.importAndExporter.$emit('export-markdown');
					break;
				}
			}
		});

		this.$root.$on('open-address', url => {
			const address = new URL(url);

			const id = address.pathname.slice(1);
			if (id && id !== this.$store.state.current.id) {
				this.$store.dispatch('load', id);
			}

			if (address.hash) {
				this.$refs.editor.scrollInto(address.hash.slice(1));
			}
		});
		window.addEventListener('popstate', () => {
			this.$root.$emit('open-address', location.href);
		});
	},
	mounted() {
		if (location.hash) {
			this.$refs.editor.scrollInto(location.hash.slice(1));
		}
	},
	computed: {
		currentID() {
			return this.$store.state.current.id;
		},
	},
	watch: {
		currentID(id) {
			if (id && id !== location.pathname.slice(1)) {
				history.pushState(null, '', '/' + id);
			}
		},
	},
};
</script>
