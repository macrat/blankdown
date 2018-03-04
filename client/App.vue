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
	<main>
		<side-pane
			@import-request=importRequest
			@export-request=exportRequest />
		<markdown-editor ref=editor />

		<import-and-exporter
			ref=importAndExporter
			@image-loaded="$refs.editor.insertImage($event.filename, $event.url)" />
	</main>
</template>

<script>
import SidePane from './SidePane.vue';

import ComponentLoading from './ComponentLoading.vue';

import ImportAndExporter from './ImportAndExporter.vue';


export default {
	components: {
		SidePane: SidePane,
		MarkdownEditor: () => ({
			component: require.ensure([], require => require('./MarkdownEditor/index.vue'), 'MarkdownEditor'),
			loading: ComponentLoading,
			delay: 0,
		}),

		ImportAndExporter: ImportAndExporter,
	},
	created() {
		this.$root.$on('open-address', url => {
			const address = new URL(url);

			const id = address.pathname.slice(1);
			if (id && (!this.$store.state.current || id !== this.$store.state.current.ID)) {
				this.$store.dispatch('open', id);
			}

			if (address.hash && this.$refs.editor.scrollInto) {
				this.$refs.editor.scrollInto(address.hash.slice(1));
			}
		});
	},
	mounted() {
		window.addEventListener('keydown', ev => {
			if (ev.ctrlKey) {
				switch (ev.key) {
				case 'm':
					ev.preventDefault();
					this.$store.dispatch('create');
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

		window.addEventListener('popstate', () => {
			this.$root.$emit('open-address', location.href);
		});

		this.$store.subscribe(ev => {
			if (ev.type === 'database-opened') {
				this.$root.$emit('open-address', location.href);
			}
		});
	},
	computed: {
		currentID() {
			return this.$store.state.current && this.$store.state.current.ID;
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
