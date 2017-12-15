<style scoped>
.markdown-editor {
	box-sizing: border-box;
	padding: .5em;
}
.markdown-editor-readonly {
	background-color: transparent;
	opacity: .7;
}
</style>

<style>
.CodeMirror {
	height: 100%;
	width: 100%;
	cursor: text;
}
.CodeMirror span {
	word-wrap: break-word;
	overflow-wrap: break-word;
	word-break: break-all;
}
.cm-header {
	margin: 1em 0 .5em;
	font-size: 1.3em;
}
.cm-header.cm-header-1 {
	font-size: 1.8em;
	margin: .7em 0 .3em;
}
.cm-header.cm-header-2 {
	font-size: 1.6em;
	margin: .8em 0 .4em;
}
.cm-header.cm-header-3 {
	font-size: 1.4em;
}
</style>

<template>
	<div class=markdown-editor :class="{ 'markdown-editor-readonly': $store.state.current.readonly }">
		<vue-code-mirror
			ref=codemirror
			:value=$store.state.current.markdown
			@change=update
			:options=options />
	</div>
</template>

<script>
import { codemirror as VueCodeMirror } from 'vue-codemirror-lite';
require('codemirror/theme/elegant.css');
require('./codemirror-modes');


export default {
	components: { VueCodeMirror },
	created() {
		this.$root.$on('insert-image', data => {
			this.doc.replaceRange(`![${data.name}](${data.url})`, this.doc.getCursor());
		});
	},
	computed: {
		options() {
			return {
				mode: 'gfm',
				theme: 'elegant',
				dragDrop: false,
				lineWrapping: true,
				xml: false,
				gitHubSpice: false,
				readOnly: this.$store.state.current.readonly,
			};
		},
		editor() {
			return this.$refs.codemirror.editor;
		},
		doc() {
			return this.editor.getDoc();
		},
	},
	methods: {
		focus() {
			this.editor.focus();
		},
		update(markdown) {
			this.$store.dispatch('update', markdown);
		},
	},
};
</script>
