<style scoped>
.markdown-writer {
	display: flex;
}

.markdown-editor {
	flex: 1 1 0;
	outline: none;
	border: 0;
	resize: none;
}

.markdown-viewer {
	 flex: 1 1 0;
	 padding-left: 1em;
}
</style>

<template>
	<div class=markdown-writer>
		<markdown-editor :scroll=scroll @update:scroll=scrolled ref=editor />
		<markdown-viewer :scroll=scroll @update:scroll=scrolled />
	</div>
</template>

<script>
import MarkdownEditor from './MarkdownEditor.vue';
import MarkdownViewer from './MarkdownViewer.vue';


export default {
	data() {
		return {
			scroll: {
				x: 0,
				y: 0,
			},
		};
	},
	components: {
		MarkdownEditor: MarkdownEditor,
		MarkdownViewer: MarkdownViewer,
	},
	methods: {
		focus() {
			this.$refs.editor.focus();
		},
		scrolled(ev) {
			this.scroll = {
				x: Math.round(ev.x * 100) / 100,
				y: Math.round(ev.y * 100) / 100,
			}
		}
	},
	mounted() {
		this.focus();
	},
};
</script>
