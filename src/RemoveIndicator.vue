<style scoped>
.indicator {
	z-index: 10;
}

.indicator-enter-active, .indicator-leave-active {
	transition: opacity .5s;
}
.indicator-enter, .indicator-leave-to {
	opacity: 0;
}
</style>

<template>
	<div>
		<transition name=indicator>
			<div v-if=removed class=indicator :style=style>removed <b>{{ lastestName }}</b> <a draggable=false href @click.prevent=dismiss>dismiss</a></div>
		</transition>
		<transition name=indicator>
			<div v-if=restored class=indicator :style=style>restored</div>
		</transition>
	</div>
</template>

<script>
import { debounce } from 'lodash-es';


export default {
	data() {
		return {
			removed: false,
			restored: false,
			style: {
				'position': 'fixed',
				'left': '1em',
				'bottom': '1em',
				'background-color': 'rgba(245, 245, 245, 0.8)',
				'padding': '.5em 2em',
				'border': '1px solid rgba(0, 0, 0, 0.05)',
				'color': '#666',
			},
		};
	},
	computed: {
		lastestID() {
			return this.$store.state.lastRemoved.id;
		},
		lastestName() {
			return get_name_by_markdown(this.$store.state.lastRemoved.markdown);
		},
		willHide() {
			return debounce(() => this.removed = false, 5000);
		},
	},
	created() {
		this.$watch('lastestID', newID => {
			if (newID) {
				this.removed = true;
				this.willHide();
			}
		});
	},
	methods: {
		dismiss() {
			this.$store.dispatch('restoreRemoved');
			this.removed = false;
			setTimeout(() => {
				this.restored = true;
				setTimeout(() => this.restored = false, 1000);
			}, 200);
		},
	},
};
</script>
