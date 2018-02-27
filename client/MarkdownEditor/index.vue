<style scoped>
.markdown-editor {
	box-sizing: border-box;
	overflow: hidden;
	height: 100%;
	width: 100%;
}
.vue-codemirror-wrap {
	height: 100%;
	width: 100%;
}
</style>

<style src="./style.css"></style>

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
import CheckListWidget from './CheckListWidget.js';
import HorizontalLineWidget from './HorizontalLineWidget.js';


export default {
	components: { VueCodeMirror },
	mounted() {
		this.widgetManager.enable(new ThumbnailWidget());
		this.widgetManager.enable(new TOCWidget(this.tocCreated));
		this.widgetManager.enable(new CheckListWidget());
		this.widgetManager.enable(new HorizontalLineWidget());

		const timer = setInterval(() => {
			this.focus();
			if (this.editor.hasFocus()) {
				clearInterval(timer);

				if (location.hash) {
					this.scrollInto(location.hash.slice(1));
				}
			}
		}, 10);
	},
	computed: {
		options() {
			return {
				mode: 'markdown',
				theme: 'elegant',
				dragDrop: false,
				lineWrapping: true,
				scrollbarStyle: 'overlay',
				indentUnit: 4,
				tabSize: 4,
				indentWithTabs: true,
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
			if (element) {
				element.innerHTML = toc || this.$store.getters.toc_html;
			}
		},
	},
	watch: {
		'$store.getters.toc_html': function(toc) {
			this.$el.querySelectorAll('.toc-widget').forEach(elm => this.tocCreated(elm, toc));
		},
	},
};
</script>
