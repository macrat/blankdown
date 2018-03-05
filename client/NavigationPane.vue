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
	height: 32px;
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
</style>

<template>
	<nav>
		<div id=nav-inner :class="{ 'nav-inner-hide': !shown }">
			<vue-code-mirror
				id=searchbox
				placeholder="search"
				:options=options
				@change=search />

			<ul id=tag-area>
				<li>all</li>
				<li><span class=tag>this</span></li>
				<li><span class=tag>is</span></li>
				<li><span class=tag>tag</span>
					<ul>
						<li><span class=tag><span class=tag-path>tag/</span>in</span>
							<ul>
								<li><span class=tag><span class=tag-path>tag/in/</span>tag</span></li>
							</ul>
						</li>
					</ul>
				</li>
				<li><span class=tag>long_long_tag_name</span></li>
				<li><span class=tag>t</span></li>
				<li><span class=tag>tag-name</span></li>

				<li><span class=tag>tagset</span>
					<ul>
						<li><span class=tag><span class=tag-path>tagset/</span>tagname</span></li>
						<li><span class=tag><span class=tag-path>tagset/</span>foo</span></li>
						<li><span class=tag><span class=tag-path>tagset/</span>bar</span>
							<ul>
								<li><span class=tag><span class=tag-path>tagset/bar/</span>baz</span></li>
							</ul>
						</li>
					</ul>
				</li>
			</ul>
		</div>
	</nav>
</template>

<script>
import { codemirror as VueCodeMirror } from 'vue-codemirror-lite';
import 'codemirror/addon/scroll/simplescrollbars.css';
import 'codemirror/addon/scroll/simplescrollbars.js';


export default {
	components: { VueCodeMirror },
	data() {
		return {
			shown: true,
		};
	},
	computed: {
		options() {
			return {
				mode: 'text',
				lineWrapping: false,
				scrollbarStyle: 'null',
			};
		},
	},
	watch: {
		'$store.state.current': function(current) {
			if (current) {
				this.shown = false;
			} else {
				this.shown = true;
			}
		},
	},
	methods: {
		search(query) {
			this.$emit('search', query);
			this.$store.dispatch('search', query);
		},
	},
};
</script>
