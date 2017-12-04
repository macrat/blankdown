<template>
	<div>
		<toast-indicator ref=removed :duration=5000 :left=true>removed <b>{{ lastestName }}</b> <a draggable=false href @click.prevent=dismiss>dismiss</a></toast-indicator>

		<toast-indicator ref=restored :duration=1000 :left=true>restored</toast-indicator>
	</div>
</template>

<script>
import ToastIndicator from './ToastIndicator.vue';


export default {
	components: { ToastIndicator },
	computed: {
		lastestID() {
			return this.$store.state.lastRemoved.id;
		},
		lastestName() {
			return this.$store.getters.removed_name;
		},
	},
	created() {
		this.$watch('lastestID', newID => {
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
