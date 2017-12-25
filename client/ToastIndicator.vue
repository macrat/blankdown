<style scoped>
.indicator {
	z-index: 10;
	position: fixed;
	bottom: .5em;
	background-color: lightslategray;
	padding: .5em 2em;
	color: white;
}

.indicator-enter-active, .indicator-leave-active {
	transition: opacity .5s;
}
.indicator-enter, .indicator-leave-to {
	opacity: 0;
}
</style>

<template>
	<transition name=indicator>
		<div class=indicator v-if=shown :style="{ right: right ? '.5em' : null, left: left ? '.5em' : null }">
			<slot />
		</div>
	</transition>
</template>

<script>
import { debounce } from 'lodash-es';


export default {
	props: ['duration', 'right', 'left'],
	data() {
		return {
			shown: false,
		};
	},
	computed: {
		reserveHide() {
			return debounce(() => this.$emit('hide-now'), this.duration);
		},
	},
	created() {
		this.$on('show', () => {
			this.shown = true;
		});
		this.$on('popup', () => {
			this.shown = true;
			this.reserveHide();
		});
		this.$on('hide', () => {
			this.reserveHide();
		});
		this.$on('hide-now', () => {
			this.shown = false;
		});
	},
};
</script>
