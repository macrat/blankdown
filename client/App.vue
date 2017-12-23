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
		<side-pane
			@import-request=importRequest
			@export-request=exportRequest />
		<markdown-editor ref=editor />

		<saving-indicator />
		<remove-indicator />

		<import-and-exporter
			ref=importAndExporter
			@image-loaded="$refs.editor.insertImage($event.filename, $event.url)" />
	</main>
</template>

<script>
import SidePane from './SidePane.vue';

import MarkdownEditor from './MarkdownEditor/index.vue';

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
	created() {
		window.addEventListener('keydown', ev => {
			if (ev.ctrlKey) {
				switch (ev.key) {
				case 'm':
					ev.preventDefault();
					this.$store.dispatch('create');
					break;
				case 's':
					ev.preventDefault();
					this.$store.dispatch('save');
					break;

				case 'O':
					ev.preventDefault();
					this.importRequest();
					break;
				case 'S':
					ev.preventDefault();
					this.exportRequest('markdown');
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
	methods: {
		importRequest() {
			this.$refs.importAndExporter.importMarkdown();
		},
		exportRequest(type) {
			switch (type) {
			case 'markdown':
				this.$refs.importAndExporter.exportMarkdown();
				break;
			case 'html':
				this.$refs.importAndExporter.exportHTML();
				break;
			}
		},
	},
};
</script>
