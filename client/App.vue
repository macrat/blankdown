<style scoped>
main {
	display: flex;
	margin: 0;
	height: 100vh;
}

@media (max-width: 780px) {
	main {
		flex-direction: column;
		height: auto;
	}
}
</style>

<style>
body.edit-mode {
	overflow: hidden;
}
::-webkit-scrollbar {
	width: 6px;
}
::-webkit-scrollbar-track {
	background-color: #eeeeee;
}
::-webkit-scrollbar-track:vertical {
	border-left: 1px solid #e6e6e6;
}
::-webkit-scrollbar-thumb {
	background-color: #404e50;
}
::-webkit-scrollbar-thumb:hover {
	background-color: #303e40;
}
</style>

<template>
	<main>
		<navigation-pane />
		<filer-pane />

		<import-and-exporter
			ref=importAndExporter
			@image-loaded="$refs.editor.insertImage($event.filename, $event.url)" />
	</main>
</template>

<script>
import NavigationPane from './NavigationPane.vue';
import FilerPane from './FilerPane.vue';

import ImportAndExporter from './ImportAndExporter.vue';


export default {
	components: {
		NavigationPane: NavigationPane,
		FilerPane: FilerPane,
		ImportAndExporter: ImportAndExporter,
	},
	created() {
		this.$root.$on('open-address', url => {
			const address = new URL(url);

			const id = address.pathname.slice(1);
			if (id && (!this.$store.state.current || id !== this.$store.state.current.ID)) {
				this.$store.dispatch('open', id);
			} else {
				this.$store.commit('close');
			}

			if (address.hash && this.$refs.editor.scrollInto) {
				this.$refs.editor.scrollInto(address.hash.slice(1));
			}

			this.currentUpdated();
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
		'$store.state.current': function() {
			this.currentUpdated();
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
		currentUpdated() {
			if (this.$store.state.current === null) {
				document.body.classList.remove('edit-mode');
			} else {
				document.body.classList.add('edit-mode');
			}
		},
	},
};
</script>
