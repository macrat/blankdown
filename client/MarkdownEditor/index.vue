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

.CodeMirror-overlayscroll-vertical > div {
	border-radius: 0;
	background: lightslategray;
	transition: background .1s ease, width .1s ease;
	width: .4em;
}

.CodeMirror-overlayscroll-vertical > div:hover, .CodeMirror-overlayscroll-vertical > div:active {
	background: slategray;
	width: .8em;
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

.toc-widget {
	display: inline-block;
	background-color: #eee;
	border-left: .1em solid black;
	border-right: .1em solid black;
	padding: .5em 1em;
}
.toc-widget-title {
	font-size: 150%;
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
import Vue from 'vue';

import { codemirror as VueCodeMirror } from 'vue-codemirror-lite';
import 'codemirror/theme/elegant.css';
import 'codemirror/addon/scroll/simplescrollbars.css';
import 'codemirror/addon/scroll/simplescrollbars.js';
import './modes.js';

import widgets from 'codemirror-widgets';

import ThumbnailWidget from './ThumbnailWidget.js';
import TOCWidget from './TOCWidget.js';


export default {
	components: { VueCodeMirror },
	mounted() {
		this.widgetManager.enable(new ThumbnailWidget());
		this.widgetManager.enable(new TOCWidget(this.tocCreated));

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
				scrollbarStyle: 'overlay',
				indentUnit: 4,
				tabSize: 4,
				indentWithTabs: true,
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
		insertImage(text, url) {
			this.doc.replaceRange(`![${text}](${url})`, this.doc.getCursor());
		},
		tocCreated(element, toc=null) {
			const elm = element.querySelector('.toc-widget-content');
			if (elm) {
				elm.innerHTML = toc || this.$store.getters.toc_html;
			}
		},
	},
	watch: {
		'$store.getters.toc_html': function(toc) {
			this.$el.querySelectorAll('.toc-widget-content').forEach(elm => this.tocCreated(elm, toc));
		},
	},
};
</script>
