<style scoped>
.markdown-viewer {
	box-sizing: border-box;
	overflow: auto;
	overflow-wrap: break-word;
}
</style>

<template>
	<html-viewer
		class=markdown-viewer
		:html=$store.getters.html
		@scroll.native=scrolled />
</template>

<script>
import HTMLViewer from './HTMLViewer.vue';


export default {
	props: ['scroll'],
	components: { 'html-viewer': HTMLViewer },
	watch: {
		scroll(val) {
			const w = this.$el.scrollWidth - this.$el.clientWidth;
			const h = this.$el.scrollHeight - this.$el.clientHeight;
			this.$el.scrollTo(val.x * w, val.y * h);
		},
	},
	methods: {
		scrolled(ev) {
			const w = this.$el.scrollWidth - this.$el.clientWidth;
			const h = this.$el.scrollHeight - this.$el.clientHeight;
			this.$emit('update:scroll', {
				x: w == 0 ? 0 : this.$el.scrollLeft / w,
				y: h == 0 ? 0 : this.$el.scrollTop / h,
			});
		},
	},
};
</script>

<style>
	.markdown-viewer table, .markdown-viewer tr, .markdown-viewer th, .markdown-viewer td {
		border-collapse: collapse;
		border: 1px solid #ccc;
	}
	.markdown-viewer th, .markdown-viewer td {
		padding: .5em 1em;
	}

	.markdown-viewer img {
		max-width: 100%;
		height: auto;
	}

	.markdown-viewer .anchor {
		color: black;
		text-decoration: none;
	}

	pre code {
		display: block;
		overflow: auto;
		padding: 0.5em;
		background: #F5F5F5;
		width: 95%;
	}
	
	.hljs-subst {
		color: #444;
	}

	.hljs-comment {
		color: #888888;
	}

	.hljs-keyword, .hljs-selector-tag, .hljs-meta-keyword, .hljs-doctag, .hljs-name {
		font-weight: bold;
	}

	.hljs-attribute {
		color: #0E9A00;
	}

	.hljs-function {
		color: #99069A;
	}

	.hljs-builtin-name {
		color: #99069A;
	}

	.hljs-type, .hljs-string, .hljs-number, .hljs-selector-id, .hljs-selector-class, .hljs-quote, .hljs-template-tag, .hljs-deletion {
		color: #880000;
	}

	.hljs-title, .hljs-section {
		color: #880000;
		font-weight: bold;
	}

	.hljs-regexp, .hljs-symbol, .hljs-variable, .hljs-template-variable, .hljs-link, .hljs-selector-attr, .hljs-selector-pseudo {
		color: #BC6060;
	}

	.hljs-literal {
		color: #78A960;
	}

	.hljs-built_in, .hljs-bullet, .hljs-code, .hljs-addition {
		color: #0C9A9A;
	}

	.hljs-meta {
		color: #1f7199;
	}

	.hljs-meta-string {
		color: #4d99bf;
	}

	.hljs-emphasis {
		font-style: italic;
	}

	.hljs-strong {
		font-weight: bold;
	}
</style>
