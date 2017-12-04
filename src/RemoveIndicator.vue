<template>
	<div>
		<toast-indicator ref=removed :duration=5000 :left=true>removed <b>{{ $store.getters.removed_name }}</b> <a draggable=false href @click.prevent=dismiss>dismiss</a></toast-indicator>

		<toast-indicator ref=restored :duration=1000 :left=true>restored</toast-indicator>
	</div>
</template>

<script>
import ToastIndicator from './ToastIndicator.vue';


export default {
	components: { ToastIndicator },
	created() {
		this.$watch('$store.state.lastRemoved.id', newID => {
			if (newID) {
				this.$refs.removed.$emit('popup');
			} else {
				this.$refs.restored.$emit('popup');
			}
		});
	},
	methods: {
		dismiss() {
			this.$store.dispatch('restoreRemoved');
			this.$refs.removed.$emit('hide-now');
		},
	},
};
</script>
