<style scoped>
#filer-pane {
	width: 100%;
	overflow: auto;
}
#filer-pane.filer-edit {
	overflow: hidden !important;
}
#card-area {
	display: flex;
	padding: 6px;
	flex-wrap: wrap;
}
.card {
	position: relative;
	display: inline-block;
	box-sizing: border-box;
	width: 260px;
	height: 220px;
	margin: 6px;
	border: 1px solid #505e60;
	cursor: pointer;
	overflow: hidden;
}
#create-card {
	text-align: center;
	opacity: .5;
}
.card-file:after {
	content: ' ';
	position: absolute;
	top: 0;
	right: 0;
	z-index: 10;
	border: 10px solid transparent;
	border-top-color: #303e40;
	border-right-color: #303e40;
}

.card-inner {
	box-sizing: border-box;
	background-color: white;

	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	padding: 0;
	border: 0 solid #505e60;
	transition: .2s width, .2s height, .2s top, .2s left, .2s border-width;
	z-index: 20;
}
.card-inner.card-mode {
	transition: none;
	position: relative;
	top: 0;
	left: 0;
	width: auto;
	height: auto;
	border-width: 0;
	z-index: 0;
}

#close-button {
	position: fixed;
	top: 0;
	left: 0;
	z-index: 22;
	transition: .1s top, .1s left;
}
#close-button.close-button-hide {
	top: -32px;
	left: -32px;
}
#create-button {
	position: fixed;
	bottom: 0;
	right: 0;
}
#create-button *, #close-button * {
	cursor: pointer;
}

@media (max-width: 780px) {
	#filer-pane {
		display: flex;
		justify-content: center;
		overflow: initial;
	}
	#card-area {
		width: 544px;
	}
}
@media (max-width: 556px) {
	#card-area {
		flex-direction: column;
		flex-wrap: nowrap;
	}
	.card {
		width: auto;
		height: 180px;
	}
	#create-card svg {
		margin-top: -20px;
	}
}

::-webkit-scrollbar {
	width: 8px;
}
</style>

<style>
.card-mode .CodeMirror, .card-mode .CodeMirror-lines {
	cursor: pointer;
}

.card-inner .CodeMirror-sizer {
	padding: 32px;
	transition: .2s padding;
}
.card-inner.card-mode .CodeMirror-sizer {
	padding: 0;
}
</style>

<template>
	<div
		id=filer-pane
		:class="{ 'filer-edit': Boolean($store.state.current) }">

		<div id=card-area>
			<div
				class=card
				v-for="file in $store.state.files"
				@click="openFile(file)"
				:data-file-id=file.ID>

				<markdown-editor
					class="card-inner card-file"
					:class="{ 'card-mode': !$store.state.current || $store.state.current.ID !== file.ID }"
					:file=file
					:cardmode="!$store.state.current || $store.state.current.ID !== file.ID" />
			</div>

			<div id=create-card class=card @click=create>
				<svg width="260" height="220">
					<path style="stroke: #505e60; stroke-width: 8px; stroke-opacity: .3;" d="m -28,0 l 56,0 m -28,-28 l 0,56" transform="translate(130, 110)" />
				</svg>
			</div>
		</div>

		<svg
			width="64"
			height="64"
			id=close-button
			:class="{ 'close-button-hide': !$store.state.current }">

			<path @click=close style="fill: #303e40; stroke: none;" d="m 0,0 l 64,0 l -64,64" />
			<path @click=close style="stroke: white; stroke-width: 4px;" d="m 10,0 l -10,10 l 10,10 m -10,-10 l 20,0" transform="translate(10, 10)" />
		</svg>
		<svg width="64" height="64" id=create-button>
			<path @click=create style="fill: #303e40; stroke: none;" d="m 64,0 l 0,64 l -64,0" />
			<path @click=create style="stroke: white; stroke-width: 4px;" d="m -20,-10 l 20,0 m -10,-10 l 0,20" transform="translate(54, 54)" />
		</svg>
	</div>
</template>

<script>
import MarkdownEditor from './MarkdownEditor/index.vue';


export default {
	components: {MarkdownEditor},
	methods: {
		openFile(file) {
			if (this.$store.state.current && this.$store.state.current.ID === file.ID) {
				return;
			}

			this.$store.dispatch('open', file.ID);

			event.preventDefault();
			event.stopPropagation();

			const outer = this.$el.querySelector(`div[data-file-id="${file.ID}"]`);
			const inner = outer.querySelector('.card-inner');
			const pos = outer.getBoundingClientRect();

			inner.style.left = pos.x + 'px';
			inner.style.top = pos.y + 'px';
			inner.style.width = outer.offsetWidth + 'px';
			inner.style.height = outer.offsetHeight + 'px';
			inner.style.padding = '6px';
			inner.style.borderWidth = '1px';

			this.$nextTick(() => {
				inner.style.top = '';
				inner.style.left = '';
				inner.style.width = '';
				inner.style.height = '';
				inner.style.padding = '';
				inner.style.borderWidth = '0px';
			});

			setTimeout(() => {
				this.$children.forEach(x => {
					if (x.file.ID === file.ID) {
						x.refresh();
						x.focus();
					}
				});
			}, 250);
		},
		close() {
			history.back();
		},
		create() {
			this.$store.dispatch('create');
		},
	},
};
</script>
