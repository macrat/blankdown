<style scoped>
li {
	display: block;
	cursor: pointer;
	font-size: 110%;
}
ul {
	padding-left: 16px;
}
a {
	display: inline-block;
	text-decoration: none;
	color: #38422d;
	padding: 1px 0;
	margin: 4px 0;
}
a:before {
	content: '#';
	margin-right: .1em;
	color: #888;
}
.child-tag:before {
	content: '/';
}
.tag-path {
	display: none;
}

@media (max-width: 780px) {
	ul, li, a {
		display: inline;
		padding: 0;
		margin: 0;
	}
	a {
		margin: 0 .5em;
	}
	.child-tag:before {
		content: '#';
	}
	.tag-path {
		display: inline;
		color: #888;
	}
}
</style>

<template>
	<ul>
		<li v-for="tag in tagsArray">
			<a
				class=tag
				:class="{ 'child-tag': isChildList }"
				@click.prevent="$emit('tag-click', tag[0])">

				<span class=tag-path>{{ path }}</span>{{ tag[0] }}
			</a>

			<tag-list
				v-if="tag[1].children.size > 0"
				:path="(path || '') + tag[0] + '/'"
				:tags=tag[1].children
				@tag-click="$emit('tag-click', tag[0] + '/' + $event)" />
		</li>
	</ul>
</template>

<script>
export default {
	name: 'tag-list',
	props: ['path', 'tags'],
	computed: {
		isChildList() {
			return Boolean(this.path);
		},
		tagsArray() {
			return [...this.tags.entries()].sort((x, y) => y[1].num - x[1].num);
		},
	},
};
</script>
