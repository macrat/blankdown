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
	<synchronize-scroll class=markdown-writer>
		<markdown-editor ref=editor />
		<markdown-viewer />
	</synchronize-scroll>
</template>

<script>
import MarkdownEditor from './MarkdownEditor.vue';
import MarkdownViewer from './MarkdownViewer.vue';
import SynchronizeScroll from './SynchronizeScroll.vue';


export default {
	components: {
		MarkdownEditor: MarkdownEditor,
		MarkdownViewer: MarkdownViewer,
		SynchronizeScroll: SynchronizeScroll,
	},
	methods: {
		focus() {
			this.$refs.editor.focus();
		},
	},
	mounted() {
		this.focus();
	},
};
</script>
