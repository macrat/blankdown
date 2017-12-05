<style scoped>
.dialog-backboard {
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	display: flex;
	justify-content: center;
	align-items: center;
}

.dialog-window {
	background-color: rgba(255, 255, 255, 0.5);;
	border: 1px solid rgba(0, 0, 0, 0.05);
	text-align: center;
	padding: 3em 5em;
}

.dialog-enter-active, .dialog-leave-active {
	transition: opacity .3s;
}
.dialog-enter, .dialog-leave-to {
	opacity: 0;
}

.dialog-show-content {
	transition: filter .3s;
	filter: none;
}
.dialog-hide-content {
	transition: filter .3s;
	filter: blur(5px) grayscale(50%);
}
</style>

<template>
	<div class=dialog-wrapper>
		<div :class="{ 'dialog-show-content': !opened, 'dialog-hide-content': opened }">
			<slot />
		</div>

		<transition name=dialog>
			<div class=dialog-backboard v-if=opened @click="$emit('switch', !opened)">
				<div class=dialog-window @click.stop>
					<slot name=dialog />
				</div>
			</div>
		</transition>
	</div>
</template>

<script>
export default {
	props: ['opened'],
	model: {
		prop: 'opened',
		event: 'switch',
	},
};
</script>
