<style>
.markdown-editor:disabled {
	background-color: transparent;
	color: #999;
}
</style>

<template>
	<textarea
		class=markdown-editor
		style="box-sizing: border-box; padding: .5em;"
		@keydown.tab.prevent=indent
		@input="update($event.target.value)"
		:value=$store.state.current.markdown
		:disabled=$store.state.current.readonly></textarea>
</template>

<script>
export default {
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
