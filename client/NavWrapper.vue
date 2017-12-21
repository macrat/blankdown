<style scoped>
.nav-header {
	background-color: white;
	padding: .3em .5em .5em;
}

.nav-header-link {
	color: #333;
	text-decoration: none;
	margin: 0 .5em;
	user-select: none;
	font-size: 120%;
}

.nav-blind {
	position: fixed;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	z-index: 5;
}

.nav-show-content {
	transition: filter .3s;
	filter: none;
}
.nav-hide-content {
	transition: filter .3s;
	filter: blur(5px) grayscale(50%);
}
</style>

<template>
	<div class=nav-wrapper>
		<div class=nav-content-area :class="{ 'nav-show-content': !opened, 'nav-hide-content': opened }">
			<nav class=nav-header>
				<a
					draggable=false
					:href="'#' + group.name.toLowerCase()"
					class=nav-header-link
					v-for="group in groups"
					@click.prevent="open(group.slot.componentInstance)">{{ group.name }}</a>
			</nav>
			<div class=nav-blind v-if=opened @click=closeAll />
			<slot name=content />
		</div>
		<div>
			<slot />
		</div>
	</div>
</template>

<script>
export default {
	computed: {
		groups() {
			return this.$slots.default.filter(slot => slot.componentOptions).map(slot => {
				return {
					slot: slot,
					name: slot.componentOptions.propsData.shortName || slot.componentOptions.propsData.name,
				};
			});
		},
	},
	data() {
		return {
			opened: false,
			current: null,
		};
	},
	mounted() {
		this.groups.forEach(x => x.slot.componentInstance.$on('change_opened', opened => {
			this.opened = opened;
			this.current = opened ? x.slot.componentInstance : null;

			if (!opened) {
				this.$emit('closed');
			}
		}));
		window.addEventListener('keydown', this.shortcut);

		this.$on('open', name => {
			this.groups.forEach(x => {
				if (x.name.toLowerCase() === name.toLowerCase()) {
					this.open(x.slot.componentInstance);
				};
			});
		});
		this.$on('close', this.closeAll);
	},
	methods: {
		closeAll() {
			this.groups.forEach(slot => {
				slot.slot.componentInstance.close();
			});
		},
		open(component) {
			this.closeAll();
			component.open();
			this.$emit('opened', component.shortName || component.name);
		},
		shortcut(ev) {
			if (ev.altKey) {
				this.groups.forEach(slot => {
					if (ev.key === slot.name[0].toLowerCase()) {
						ev.preventDefault();

						if (this.current === slot.slot.componentInstance) {
							this.closeAll();
						} else {
							this.open(slot.slot.componentInstance);
						}
					}
				});
			} else if (ev.key == 'Escape' && this.opened) {
				ev.preventDefault();
				this.closeAll();
			}
		},
	},
};
</script>
