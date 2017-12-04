<style scoped>
.nav-drawer-link {
	color: black;
	text-decoration: none;
	display: block;
	margin: .7em 0;
	cursor: pointer;
}

.nav-drawer-link-disabled {
	color: #999;
}
</style>

<template>
	<a
		draggable=false
		:href=href
		@click.prevent=click
		class="nav-drawer-link"
		:class="{ 'nav-drawer-link-disabled': disabled }"><slot /></a>
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
