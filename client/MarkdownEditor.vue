<style scoped>
.markdown-editor {
	box-sizing: border-box;
	padding: .5em;
}
.markdown-editor-readonly {
	background-color: transparent;
	opacity: .5;
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
			:options=options
			@update=update />
	</div>
</template>

<script>
import { codemirror as VueCodeMirror } from 'vue-codemirror-lite';
require('codemirror/theme/elegant.css');
require('./codemirror-modes');


export default {
	props: ['scroll'],
	components: { VueCodeMirror },
	created() {
		this.$root.$on('insert-image', data => {
			this.doc.replaceRange(`![${data.name}](${data.url})`, this.doc.getCursor());
		});
	},
	watch: {
		scroll(val) {
			const info = this.editor.getScrollInfo();
			const w = info.width - info.clientWidth;
			const h = info.height - info.clientHeight;
			this.editor.scrollTo(val.x * w, val.y * h);
		},
	},
	mounted() {
		this.editor.on('scroll', ev => {
			const info = ev.getScrollInfo();
			const w = info.width - info.clientWidth;
			const h = info.height - info.clientHeight;
			this.$emit('update:scroll', {
				x: w == 0 ? 0 : info.left / w,
				y: h == 0 ? 0 : info.top / h,
			});
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
		scrolled(ev) {
			this.$emit('scroll', ev);
		},
	},
};
</script>
