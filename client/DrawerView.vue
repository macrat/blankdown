<style scoped>
.drawer-view {
	height: 100vh;
	display: flex;
}

.drawer-view-content {
	height: 100%;
	width: 200px;
}

.drawer-view-border {
	height: 100%;
	width: .7em;
	border: 1px solid black;
	border-width: 0 1px;
}

.drawer-view-content-dragging {
	overflow: hidden;
	word-wrap: unset;
	word-break: unset;
	white-space: nowrap;
	display: block !important;
}

.drawer-view-enter-active, .drawer-view-leave-active {
	transition: ease width .5s;
	overflow: hidden;
	word-wrap: unset;
	word-break: unset;
	white-space: nowrap;
}
.drawer-view-enter, .drawer-view-leave-to {
	width: 0;
}
</style>

<template>
	<div class=drawer-view>
		<transition name=drawer-view>
			<div
				class=drawer-view-content
				:class="{ 'drawer-view-content-dragging': dragging }"
				:style="{ width: dragWidth }"
				v-show=opened>

				<slot />
			</div>
		</transition>

		<div class=drawer-view-border>
			<div class=drawer-view-openclose></div>
		</div>
	</div>
</template>

<script>
export default {
	data() {
		return {
			opened: false,
			width: 200,
			dragWidth: null,
		};
	},
	computed: {
		dragging() {
			return this.dragWidth !== null;
		},
	},
	methods: {
		open() {
			this.opened = true;
		},
		close() {
			this.opened = false;
		},
	},
	mounted() {
		let dragStart = null;
		let oldPos = null;
		let moveDistance = 0;

		this.$el.querySelector('.drawer-view-border').addEventListener('mousedown', ev => {
			dragStart = ev.clientX;
			oldPos = this.opened ? this.width : 0;
			moveDistance = 0;
		});
		window.addEventListener('mousemove', ev => {
			if (dragStart !== null) {
				ev.preventDefault();
				const move = ev.clientX - dragStart;
				if (this.opened) {
					this.dragWidth = Math.max(0, Math.min(this.width, this.width + move)) + 'px';
				} else {
					this.dragWidth = Math.max(0, Math.min(this.width, move)) + 'px';
				}
				moveDistance += Math.abs(move - oldPos);
				oldPos = move;
			}
		});
		window.addEventListener('mouseup', ev => {
			if (dragStart === null) {
				return;
			}
			ev.preventDefault();

			const move = ev.clientX - dragStart;
			dragStart = null;
			this.dragWidth = null;

			if (moveDistance < 10) {
				if (this.opened) {
					this.close();
				} else {
					this.open();
				}
				return;
			}

			if (this.opened && move < this.width - 10) {
				this.close();
			} else if (!this.opened && move > 10) {
				this.open();
			}
		});
	},
};
</script>
