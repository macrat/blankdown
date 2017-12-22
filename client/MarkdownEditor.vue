<style scoped>
.markdown-editor {
	box-sizing: border-box;
	overflow: hidden;
	height: 100%;
	width: 100%;
}
</style>

<style>
.CodeMirror {
	width: 100%;
	height: 100%;
	cursor: text;
}

.CodeMirror span {
	word-wrap: break-word;
	overflow-wrap: break-word;
	word-break: break-all;
}

.cm-header.cm-mark {
	color: #bbb;
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

.cm-blob-image.cm-body {
	font-size: 10%;
}
</style>

<template>
	<div class=markdown-editor>
		<vue-code-mirror
			ref=codemirror
			:value=$store.state.current.markdown
			:options=options
			@change=update />
	</div>
</template>

<script>
import { codemirror as VueCodeMirror } from 'vue-codemirror-lite';
import 'codemirror/theme/elegant.css';
import 'codemirror/addon/scroll/simplescrollbars.css';
import 'codemirror/addon/scroll/simplescrollbars.js';
import './codemirror-modes';

import widgets from 'codemirror-widgets';

import thumbnailWidget from './codemirror-markdown-thumbnails.js';


export default {
	components: { VueCodeMirror },
	created() {
		this.$root.$on('insert-image', data => {
			this.doc.replaceRange(`![${data.name}](${data.url})`, this.doc.getCursor());
		});
	},
	mounted() {
		this.widgetManager.enable(thumbnailWidget);

		const timer = setInterval(() => {
			this.focus();
			if (this.editor.hasFocus()) {
				clearInterval(timer);
			}
		}, 10);
	},
	computed: {
		options() {
			return {
				mode: 'blankdown',
				theme: 'elegant',
				dragDrop: false,
				lineWrapping: true,
				scrollbarStyle: 'simple',
				xml: false,
				gitHubSpice: false,
				readOnly: this.$store.state.current.readonly ? 'nocursor' : false,
			};
		},
		editor() {
			return this.$refs.codemirror.editor;
		},
		doc() {
			return this.editor.getDoc();
		},
		widgetManager() {
			return widgets.createManager(this.editor);
		},
	},
	methods: {
		focus() {
			this.editor.focus();
		},
		update(markdown) {
			this.$store.dispatch('update', markdown);
		},
		scrollInto(id) {
			const lineCount = this.editor.getDoc().lineCount();
			for (let line=0; line<lineCount; line++) {
				const tokens = this.editor.getLineTokens(line);
				for (let token of tokens) {
					if (token.type && token.type.split(' ').includes('header--' + id)) {
						this.editor.scrollIntoView({line: line, ch: 0});
						return;
					}
				}
			}
		},
	},
};
</script>
