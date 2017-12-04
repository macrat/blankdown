<template>
	<toast-indicator ref=indicator :duration=800 :right=true>saving...</toast-indicator>
</template>

<script>
import ToastIndicator from './ToastIndicator.vue';


export default {
	components: { ToastIndicator },
	created() {
		this.$watch('$store.state.saving', saving => {
			if (saving) {
				this.$refs.indicator.$emit('show');
			} else {
				this.$refs.indicator.$emit('hide');
			}
		});
	},
};
</script>
