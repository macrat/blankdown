<style scoped>
.drawer-view {
	height: 100vh;
	display: flex;
	background-color: slategray;
	color: white;
}

.drawer-view-dragging {
	display: block !important;
}

.drawer-view-outer {
	width: 250px;
	position: relative;
}

.drawer-view-content {
	height: 100%;
	width: 250px;
	position: absolute;
	right: 0;
}

.drawer-view-border {
	height: 100%;
	width: .7em;
	background-color: lightslategray;
	border-left: 1px solid darkslategray;
}

.drawer-view-enter-active, .drawer-view-leave-active {
	transition: ease width .5s;
}
.drawer-view-enter, .drawer-view-leave-to {
	width: 0;
}
</style>

<template>
	<div class=drawer-view>
		<vue-perfect-scrollbar>
			<transition name=drawer-view>
				<div
					class=drawer-view-outer
					:class="{ 'drawer-view-dragging': dragging }"
					:style="{ width: dragging ? dragWidth + 'px' : null }"
					v-show=opened>

					<div class=drawer-view-content>
						<slot />
					</div>
				</div>
			</transition>
		</vue-perfect-scrollbar>

		<div class=drawer-view-border>
			<div class=drawer-view-openclose></div>
		</div>
	</div>
</template>

<script>
import VuePerfectScrollbar from 'vue-perfect-scrollbar';


export default {
	components: { VuePerfectScrollbar },
	data() {
		return {
			opened: JSON.parse(localStorage.getItem('pane-opened') || 'false'),
			width: 250,
			dragWidth: null,
			dragStartPos: null,
			oldPos: null,
			moveDistance: 0,
		};
	},
	watch: {
		opened(state) {
			localStorage.setItem('pane-opened', JSON.stringify(state));

			if (state) {
				this.$emit('open');
			} else {
				this.$emit('close');
			}
		},
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
			this.dragStartPos = this.oldPos = this.dragWidth = clientX;
			this.moveDistance = 0;
		},
		dragMove(clientX) {
			if (!this.dragging) {
				return;
			}

			const move = clientX - this.dragStartPos;
			if (this.opened) {
				this.dragWidth = Math.max(0, Math.min(this.width, this.width + move));
			} else {
				this.dragWidth = Math.max(0, Math.min(this.width, move));
			}
			this.moveDistance += Math.abs(clientX - this.oldPos);
			this.oldPos = clientX;
		},
		dragEnd(clientX) {
			if (!this.dragging) {
				return;
			}

			const move = Math.abs(clientX - this.dragStartPos);
			const distance = this.moveDistance;
			this.moveDistance = null;
			this.dragStartPos = null;
			this.dragWidth = null;

			if (distance < 10 || move > this.width/5) {
				if (this.opened) {
					this.close();
				} else {
					this.open();
				}
				return;
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
