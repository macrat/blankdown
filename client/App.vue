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
	background-color: #eee;
}
::-webkit-scrollbar-track:vertical {
	border-left: 1px solid #e6e6e6;
}
::-webkit-scrollbar-thumb {
	background-color: #491022;
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
			this.$store.dispatch('openAddress', location.href);
		});

		this.$store.subscribe(ev => {
			if (ev.type === 'database-opened') {
				this.$store.dispatch('openAddress', location.href);
			}
		});
	},
	watch: {
		'$store.getters.currentName': function(name) {
			if (this.$store.state.current) {
				if (name) {
					document.title = name + ' - blankdown';
				} else {
					document.title = 'no title - blankdown';
				}
			} else {
				document.title = 'blankdown';
			}
		},
		'$store.state.current': function(current, previous) {
			if (current === null) {
				document.body.classList.remove('edit-mode');
			} else {
				document.body.classList.add('edit-mode');
			}

			if (current ? (current.ID !== location.pathname.slice(1)) : (location.pathname.slice(1))) {
				history.pushState({prev: {
					isFiler: !previous,
					ID: previous ? previous.ID : null,
				}}, '', '/' + current.ID);
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
