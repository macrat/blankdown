<style scoped>
nav {
	flex: 0 0 auto;
	width: 200px;
	overflow: scroll;
	color: #eee;
}
#nav-inner {
	position: relative;
	height: 100%;
	padding: 16px 12px;
	background-color: #303e40;
	top: 0;
	left: 0;
	transition: .2s top, .2s left;
	z-index: 23;
}
#nav-inner.nav-inner-hide {
	left: -200px;
}
#tag-area {
	margin: 0;
	padding: 0;
}
#tag-area li {
	display: block;
	cursor: pointer;
	padding: 1px 0;
}
#tag-area ul {
	padding-left: 16px;
}
.tag:before {
	content: '# ';
	color: #888;
}
.tag-path {
	display: none;
}

@media (max-width: 780px) {
	nav {
		width: auto;
	}
	#nav-inner {
		padding: 12px;
	}
	#nav-inner.nav-inner-hide {
		top: -400px;
		left: 0;
	}
	#searchbox {
		margin-bottom: 8px;
	}
	#tag-area {
		text-align: center;
	}
	#tag-area ul, #tag-area li {
		display: inline;
		padding: 0;
	}
	.tag {
		display: inline-block;
		margin: 0 .5em;
	}
	.tag:before {
		content: '#';
	}
	.tag-path {
		display: inline;
		color: #888;
	}
}
</style>

<style>
#searchbox .CodeMirror {
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
#searchbox .CodeMirror-cursor {
	border-color: white;
}

#searchbox .CodeMirror-placeholder {
	color: #999;
}
</style>

<template>
	<nav>
		<div id=nav-inner :class="{ 'nav-inner-hide': !shown }">
			<vue-code-mirror
				id=searchbox
				ref=searchbox
				:value=query
				:options=options
				@change='query = $event' />

			<ul id=tag-area>
				<li v-for="tag in tags" @click="tagClicked(tag)">{{ tag }}</li>
			</ul>
		</div>
	</nav>
</template>

<script>
import { codemirror as VueCodeMirror } from 'vue-codemirror-lite';
import 'codemirror/addon/scroll/simplescrollbars.css';
import 'codemirror/addon/scroll/simplescrollbars.js';
import 'codemirror/addon/display/placeholder.js';


export default {
	components: { VueCodeMirror },
	data() {
		return {
			shown: true,
			query: '',
		};
	},
	computed: {
		options() {
			return {
				mode: 'text',
				lineWrapping: false,
				scrollbarStyle: 'null',
				placeholder: 'search',
			};
		},
		tags() {
			return [...this.$store.state.tags].sort((x, y) => y[1] - x[1]).map(x => x[0]);
		},
	},
	mounted() {
		this.$refs.searchbox.editor.addKeyMap({
			Enter: cm => {
				this.search(cm.getDoc().getValue());
			},
		});
	},
	watch: {
		'$store.state.current': function(current) {
			if (current) {
				this.shown = false;
			} else {
				this.shown = true;
			}
		},
		query() {
			this.$emit('search', this.query);
			this.$store.dispatch('search', this.query);
		},
	},
	methods: {
		tagClicked(tag) {
			if (this.query.trim()) {
				this.query += ' #' + tag;
			} else {
				this.query = '#' + tag;
			}
		},
	},
};
</script>
