<template>
	<toast-indicator ref=indicator :duration=800 :right=true>saving...</toast-indicator>
</template>

<script>
import ToastIndicator from './ToastIndicator.vue';


export default {
	components: { ToastIndicator },
	computed: {
		saving() {
			return this.$store.state.saving;
		},
	},
	created() {
		this.$watch('saving', saving => {
			if (saving) {
				this.$refs.indicator.$emit('show');
			} else {
				this.$refs.indicator.$emit('hide');
			}
		});
	},
};
</script>
