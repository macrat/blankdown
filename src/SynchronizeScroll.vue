<template>
	<div><slot /></div>
</template>

<script>
import { throttle } from 'lodash-es';


export default {
	computed: {
		elements() {
			return this.$slots.default.filter(x => x.componentInstance).map(x => x.componentInstance.$el);
		},
	},
	mounted() {
		const scroll_manage = throttle(elm => {
			setTimeout(() => {
				const rate = Math.round(elm.scrollTop / (elm.scrollHeight - elm.clientHeight) * 1000) / 1000;
				this.elements.forEach(e => {
					if (e !== elm) {
						e.scrollTo(e.scrollLeft, (e.scrollHeight - e.clientHeight) * rate);
					}
				});
			}, 25);
		}, 50);
		this.elements.forEach(elm => {
			elm.addEventListener('scroll', () => scroll_manage(elm));
		});
	},
};
</script>
