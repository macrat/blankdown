<template>
	<a
		draggable=false
		:href=href
		@click.prevent=click
		class="nav-drawer-link"
		:class="{ 'nav-drawer-link-disabled': disabled }"
		style="cursor: pointer"><slot /></a>
</template>

<script>
export default {
	props: ['disabled', 'href'],
	methods: {
		click() {
			if (!this.disabled) {
				this.$parent.close();
				this.$emit('click');
			}
		},
	},
};
</script>
