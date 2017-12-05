<template>
	<div v-html=html />
</template>

<script>
import Vue from 'vue';


export default {
	props: ['html'],
	watch: {
		html() {
			this.makeLinkReceiver();
		},
	},
	created() {
		this.makeLinkReceiver();
	},
	methods: {
		makeLinkReceiver() {
			Vue.nextTick(() => {
				this.$el.querySelectorAll('a').forEach(elm => {
					elm.addEventListener('click', ev => {
						if (elm.origin == location.origin) {
							ev.preventDefault();
							const url = new URL(elm.href, location.href);
							this.$root.$emit('open-address', url.href);
							history.pushState(null, '', url);
						}
					});
				});
			});
		},
	},
};
</script>
