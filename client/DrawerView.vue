<style scoped>
.drawer-view {
	height: 100vh;
	display: flex;
}

.drawer-view-content {
	height: 100%;
	width: 250px;
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
			opened: true,
			width: 250,
			dragWidth: null,
			dragStartPos: null,
			oldPos: null,
			moveDistance: 0,
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

		dragStart(clientX) {
			this.dragStartPos = clientX;
			this.oldPos = this.opened ? this.width : 0;
			this.dragWidth = this.oldPos + 'px';
			this.moveDistance = 0;
		},
		dragMove(clientX) {
			if (!this.dragging) {
				return;
			}

			const move = clientX - this.dragStartPos;
			if (this.opened) {
				this.dragWidth = Math.max(0, Math.min(this.width, this.width + move)) + 'px';
			} else {
				this.dragWidth = Math.max(0, Math.min(this.width, move)) + 'px';
			}
			this.moveDistance += Math.abs(move - this.oldPos);
			this.oldPos = move;
		},
		dragEnd(clientX) {
			if (!this.dragging) {
				return;
			}

			const move = clientX - this.dragStartPos;
			this.dragStartPos = null;
			this.dragWidth = null;

			if (this.moveDistance < 10) {
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
		},
	},
	mounted() {
		let touchX = 0;

		const border = this.$el.querySelector('.drawer-view-border');
		border.addEventListener('mousedown', ev => {
			ev.preventDefault();
			this.dragStart(ev.clientX);
		}, { passive: false });
		border.addEventListener('touchstart', ev => {
			ev.preventDefault();
			touchX = ev.changedTouches[0].clientX;
			this.dragStart(touchX);
		}, { passive: false });

		window.addEventListener('mousemove', ev => {
			if (this.dragging) {
				ev.preventDefault();
				this.dragMove(ev.clientX);
			}
		}, { passive: false });
		window.addEventListener('touchmove', ev => {
			if (this.dragging) {
				ev.preventDefault();
				touchX = ev.changedTouches[0].clientX;
				this.dragMove(touchX);
			}
		}, { passive: false });

		window.addEventListener('mouseup', ev => {
			if (this.dragging) {
				ev.preventDefault();
				this.dragEnd(ev.clientX);
			}
		}, { passive: false });
		window.addEventListener('touchend', ev => {
			if (this.dragging) {
				ev.preventDefault();
				this.dragEnd(touchX);
				touchX = 0;
			}
		}, { passive: false });
	},
};
</script>
