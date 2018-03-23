<style scoped>
nav {
	flex: 0 0 auto;
	width: 200px;
	color: #eee;
}
#nav-scroll-fix-area {
	background-color: #3c4721;
	padding-bottom: 16px;
	border-bottom: 2px solid #6b842a;
}
#nav-inner {
	position: relative;
	height: 100%;
	padding: 16px 12px;
	box-sizing: border-box;
	background-color: #3c4721;
	top: 0;
	left: 0;
	transition: .2s top, .2s left;
	z-index: 23;
	overflow: auto;
}
#nav-inner.nav-inner-hide {
	left: -200px;
}
#searchbox {
	margin-bottom: 12px;
	background-color: #3c4721;
}
#tag-area, #document-area {
	margin: 0;
	padding: 0;
}
li {
	display: block;
	cursor: pointer;
	padding: 1px 0;
	margin: 4px 0;
	font-size: 110%;
}
ul {
	padding-left: 16px;
}
li a {
	text-decoration: none;
	color: #eee;
}
#document-area {
	padding-top: 12px;
}

@media (max-width: 780px) {
	nav {
		width: auto;
	}
	#nav-inner {
		padding: 12px;
		padding-top: 0;
	}
	#nav-inner.nav-inner-hide {
		top: -400px;
		left: 0;
	}
	#searchbox {
		padding-top: 12px;
		margin-bottom: 8px;
	}
	#tag-area {
		display: block;
		text-align: center;
	}
}

::-webkit-scrollbar {
	width: 8px;
}
::-webkit-scrollbar-track {
	background-color: #3c4721;
	border: none;
}
::-webkit-scrollbar-thumb {
	background-color: #a6c45c;
}
</style>

<template>
	<nav>
		<div id=nav-inner :class="{ 'nav-inner-hide': !shown }">
			<div id=nav-scroll-fix-area>
				<search-box
					id=searchbox
					v-model=query
					@search=searchNow />

				<tag-list
					id=tag-area
					:tags=$store.getters.tagTree
					@tag-click="tagClicked($event)" />
			</div>

			<ul id=document-area>
				<li><a @click.prevent="">about</a></li>
				<li><a @click.prevent="">login</a></li>
			</ul>
		</div>
	</nav>
</template>

<script>
import debounce from 'lodash-es/debounce';

import SearchBox from './SearchBox';
import TagList from './TagList';


export default {
	components: { SearchBox, TagList },
	data() {
		return {
			shown: true,
			query: '',
			lastQuery: '',
			scroll: 0,
		};
	},
	computed: {
		search() {
			return debounce(() => {
				this.searchNow(this.query);
			}, 300);
		},
	},
	mounted() {
		window.addEventListener('scroll', ev => {
			this.scroll = window.scrollY;
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
			this.search();
		},
		scroll(scroll) {
			const fixArea = this.$el.querySelector('#nav-scroll-fix-area');
			const searchbox = this.$el.querySelector('#searchbox');

			if (scroll === 0) {
				fixArea.style.position = 'initial';
				fixArea.style.top = null;
				searchbox.style.position = 'initial';
				searchbox.style.top = null;
			} else {
				const docArea = this.$el.querySelector('#document-area');
				const tagArea = this.$el.querySelector('#tag-area');

				fixArea.style.position = 'relative';
				fixArea.style.top = Math.min(scroll, docArea.scrollHeight)+ 'px';
				searchbox.style.position = 'relative';
				searchbox.style.top = Math.min(Math.max(0, scroll - docArea.scrollHeight), tagArea.scrollHeight + 16 + 8 + 2) + 'px';
			}
		},
	},
	methods: {
		tagClicked(tag) {
			this.query = '#' + tag;
		},
		searchNow(query) {
			if (this.lastQuery !== query) {
				this.$emit('search', query);
				this.$store.dispatch('search', query);
			}
			this.lastQuery = this.query;
		},
	},
};
</script>
