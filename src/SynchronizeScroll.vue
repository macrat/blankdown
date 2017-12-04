<template>
	<div><slot /></div>
</template>

<script>
import Vue from 'vue';


export default {
	computed: {
		elements() {
			return this.$slots.default.filter(x => x.componentInstance).map(x => x.componentInstance.$el);
		},
	},
	mounted() {
		this.elements.forEach(elm => {
			elm.addEventListener('scroll', () => {
				Vue.nextTick(() => {
					const rate = Math.round(elm.scrollTop / (elm.scrollHeight - elm.clientHeight) * 1000) / 1000;
					this.elements.forEach(e => {
						if (e !== elm) {
							e.scrollTo(0, (e.scrollHeight - e.clientHeight) * rate);
						}
					});
				});
			});
		});
	},
};
</script>
