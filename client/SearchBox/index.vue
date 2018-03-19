<style>
.search-box .CodeMirror {
	display: block;
	box-sizing: border-box;
	width: 100%;
	height: 36px;
	margin-bottom: 12px;
	padding: 4px 8px;
	resize: none;
	overflow: hidden;
	background-color: #505e60;
	color: white;
	border: none;
	border-radius: 0;
	font: initial;
}
.search-box .CodeMirror-cursor {
	border-color: white;
}

.search-box .CodeMirror-placeholder {
	color: #999;
}
</style>

<template>
	<vue-code-mirror
		class=search-box
		ref=editor
		:value=value
		:options=options
		@change="$emit('input', $event)" />
</template>

<script>
import { codemirror as VueCodeMirror } from 'vue-codemirror-lite';
import 'codemirror/addon/scroll/simplescrollbars.css';
import 'codemirror/addon/scroll/simplescrollbars.js';
import 'codemirror/addon/display/placeholder.js';


export default {
	props: ['value'],
	components: { VueCodeMirror },
	computed: {
		options() {
			return {
				mode: 'text',
				lineWrapping: false,
				scrollbarStyle: 'null',
				placeholder: 'search',
			};
		},
	},
	mounted() {
		this.$refs.editor.editor.addKeyMap({
			Enter: cm => {
				const query = cm.getDoc().getValue();
				this.$emit('input', query);
				this.$emit('search', query);
			},
		});
	},
};
</script>
