<style scoped>
.markdown-editor {
	box-sizing: border-box;
	padding: .5em;
}
.markdown-editor:disabled {
	background-color: transparent;
	color: #999;
}
</style>

<template>
	<textarea
		class=markdown-editor
		@keydown.tab.prevent=indent
		@input="update($event.target.value)"
		:value=$store.state.current.markdown
		:disabled=$store.state.current.readonly></textarea>
</template>

<script>
export default {
	created() {
		this.$root.$on('insert-image', data => {
			const elm = this.$el;
			const start = elm.selectionStart;

			elm.value = elm.value.slice(0, start) + `![${data.name}](${data.url})` + elm.value.slice(elm.selectionEnd);
			elm.selectionStart = elm.selectionEnd = start + 4;

			this.update(elm.value);
		});
	},
	methods: {
		indent() {
			const elm = this.$el;
			const start = elm.selectionStart;

			elm.value = elm.value.slice(0, start) + '    ' + elm.value.slice(elm.selectionEnd);
			elm.selectionStart = elm.selectionEnd = start + 4;

			this.update(elm.value);
		},
		update(markdown) {
			this.$store.dispatch('update_markdown', markdown);
		},
	},
};
</script>
