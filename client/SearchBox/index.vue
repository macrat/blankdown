<style>
.search-box div, .search-box pre {
	height: auto;
}

.search-box .CodeMirror {
	display: block;
	box-sizing: border-box;
	width: 100%;
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

.search-box .cm-searchbox-tag {
	color: #e0e0f0;
	border: 1px solid #aaa;
	border-radius: .2em;
	padding: .1em .2em;
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

import './searchbox-mode';


export default {
	props: ['value'],
	components: { VueCodeMirror },
	computed: {
		options() {
			return {
				mode: 'searchbox',
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
