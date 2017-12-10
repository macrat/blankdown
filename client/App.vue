<style>
.nav-content-area {
	height: 100vh;
	overflow: auto;
	display: flex;
	flex-direction: column;
}

nav {
	flex: 0 0 auto;
}

.markdown-writer {
	flex: 1 1 0;
}

.toc-pane ul {
	line-height: 1.3em;
}
.toc-pane a {
	color: black;
	text-decoration: none;
}
</style>

<template>
	<main :style="{ cursor: $store.state.saving ? 'progress' : 'auto' }">
		<dialog-wrapper :opened.sync=searchboxOpened @closed="$refs.writer.focus()">
			<nav-wrapper ref=nav>
				<nav-drawer name="FILE">
					<file-pain @open-file="searchboxOpened = true" />
				</nav-drawer>

				<nav-drawer name="Tabble of Contents" shortName="ToC">
					<html-viewer :html=$store.getters.toc_html class=toc-pane />
				</nav-drawer>

				<nav-drawer name="HELP">
					<nav-button @click="$store.dispatch('load', 'shortcuts')">shortcuts</nav-button>
					<nav-button @click="$store.dispatch('load', 'about')">about</nav-button>
				</nav-drawer>

				<markdown-writer ref=writer slot=content />
			</nav-wrapper>

			<search-box slot=dialog @file-opened="searchboxOpened = false; $refs.nav.$emit('close')" />
		</dialog-wrapper>

		<saving-indicator />
		<remove-indicator />
	</main>
</template>

<script>
import NavWrapper from './NavWrapper.vue';
import NavDrawer from './NavDrawer.vue';
import NavButton from './NavButton.vue';

import MarkdownWriter from './MarkdownWriter.vue';

import FilePain from './FilePain.vue';

import HTMLViewer from './HTMLViewer.vue';

import SavingIndicator from './SavingIndicator.vue';
import RemoveIndicator from './RemoveIndicator.vue';

import DialogWrapper from './DialogWrapper.vue';
import SearchBox from './SearchBox.vue';


export default {
	components: {
		NavWrapper: NavWrapper,
		NavDrawer: NavDrawer,
		NavButton: NavButton,

		MarkdownWriter: MarkdownWriter,

		FilePain: FilePain,

		'html-viewer': HTMLViewer,

		SavingIndicator: SavingIndicator,
		RemoveIndicator: RemoveIndicator,

		DialogWrapper: DialogWrapper,
		SearchBox: SearchBox,
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
			if (ev.ctrlKey && !ev.shiftKey) {
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
				try {
					this.$refs.writer.$el.querySelector(address.hash).scrollIntoView();
				} catch (e) {
				}
			}

			const pane = address.search.slice(1);
			if (pane) {
				this.$refs.nav.$emit('open', pane);
			} else {
				this.$refs.nav.$emit('close');
			}
		});
		window.addEventListener('popstate', () => {
			this.$root.$emit('open-address', location.href);
		});
	},
	mounted() {
		this.$refs.nav.$on('opened', name => {
			history.replaceState(null, '', `/${this.currentID}?${name.toLowerCase()}${location.hash}`);
		});
		this.$refs.nav.$on('closed', () => {
			history.replaceState(null, '', `/${this.currentID}${location.hash}`);
		});

		if (location.hash) {
			try {
				this.$refs.writer.$el.querySelector(location.hash).scrollIntoView();
			} catch (e) {
			}
		}

		const pane = decodeURIComponent(location.search.slice(1));
		if (pane) {
			this.$refs.nav.$emit('open', pane);
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
				if (this.$refs.nav.opened) {
					history.pushState(null, '', `/${id}?${this.$refs.nav.current.name}`);
				} else {
					history.pushState(null, '', '/' + id);
				}
			}
		},
	},
};
</script>
