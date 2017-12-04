<template>
	<synchronize-scroll style="display: flex;" class=markdown-writer>
		<markdown-editor ref=editor style="flex: 1 1 0; outline: none; border: 0; resize: none;" v-focus />
		<markdown-viewer style="flex: 1 1 0; padding-left: 1em;" />
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
			this.$refs.editor.$el.focus();
		},
	},
};
</script>
