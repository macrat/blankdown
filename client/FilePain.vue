<template>
	<div>
		<nav-button @click="$emit('click'); $store.dispatch('create')">new</nav-button>
		<nav-button @click="$emit('click'); $emit('open-file')">open</nav-button>
		<nav-button @click="$emit('click'); $store.dispatch('save')">save</nav-button>
		<nav-button @click="$emit('click'); $store.dispatch('remove')">remove</nav-button>
		<hr>
		<nav-button @click="$emit('click'); $emit('request-import')">import</nav-button>
		<nav-button @click="$emit('click'); $emit('request-export-markdown')">export as markdown</nav-button>
		<nav-button @click="$emit('click'); $emit('request-export-html')">export as HTML</nav-button>
		<hr>
		<nav-button
			v-for="file in $store.state.recent"
			:key=file.id
			@click="$emit('click'); $store.dispatch('load', file.id)"
			:disabled="file.id === $store.state.current.id"
			:href="'/' + file.id">{{ file.name }}</nav-button>
	</div>
</template>

<script>
import NavButton from './NavButton.vue';


export default {
	components: { NavButton },
};
</script>
