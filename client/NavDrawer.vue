<style scoped>
.nav-drawer {
	background-color: rgba(255, 255, 255, 0.5);
	border-right: 1px solid rgba(0, 0, 0, 0.05);
	padding: 0 .5em;
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	width: 15em;
	z-index: 2;
}

.nav-drawer hr {
	background-color: #ccc;
	border: none;
	height: 1px;
}

.nav-drawer-title {
	font-size: 150%;
	margin: .5em 0;
	border-bottom: 1px solid #ccc;
	user-select: none;
}

.nav-slide-enter-active, .nav-slide-leave-active {
	transition: left .3s, opacity .3s;
}
.nav-slide-enter, .nav-slide-leave-to {
	left: -15em;
	opacity: 0.5;
}

h1 {
	cursor: default;
}
</style>

<template>
	<transition name=nav-slide>
		<div class=nav-drawer v-if=opened>
			<h1 class=nav-drawer-title @click=close>{{ name }}</h1>
			<slot />
		</div>
	</transition>
</template>

<script>
export default {
	props: ['name', 'shortName'],
	data() {
		return {
			opened: false,
		};
	},
	methods: {
		open() {
			if (!this.opened) {
				this.opened = true;
				this.$emit('change_opened', true);
			}
		},
		close() {
			if (this.opened) {
				this.opened = false;
				this.$emit('change_opened', false);
			}
		},
	},
	mounted() {
		this.$children.forEach(child => {
			child.$watch('click', () => {
				this.close();
			});
		});
	},
};
</script>
