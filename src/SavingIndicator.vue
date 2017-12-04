<style scoped>
.indicator {
	z-index: 10;
	position: fixed;
	right: .5em;
	bottom: .5em;
	background-color: rgba(245, 245, 245, 0.8);
	padding: .5em 2em;
	border: 1px solid rgba(0, 0, 0, 0.05);
	color: #666;
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
		<div v-if=shown class=indicator>saving...</div>
	</transition>
</template>

<script>
export default {
	data() {
		return {
			shown: false,
		};
	},
	computed: {
		saving() {
			return this.$store.state.saving;
		},
	},
	created() {
		this.$watch('saving', saving => {
			if (saving) {
				this.shown = true;
			} else {
				setTimeout(() => {
					this.shown = false;
				}, 800);
			}
		});
	},
};
</script>
