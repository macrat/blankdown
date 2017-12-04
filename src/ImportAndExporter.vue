<style scoped>
* {
	display: none;
}
</style>

<template>
	<div>
		<input
			class=import-and-exporter--input-file
			@change="importFromFiles(this.event.target.files)"
			type=file
			accept="*.md" />

		<a class=import-and-exporter--download-link></a>
	</div>
</template>

<script>
export default {
	created() {
		this.$on('import', this.importMarkdown);
		this.$on('export-markdown', this.exportMarkdown);
		this.$on('export-html', this.exportHTML);

		window.addEventListener('dragover', ev => {
			ev.stopPropagation();
			ev.preventDefault();
			ev.dataTransfer.dropEffect = 'copy';
		});
		window.addEventListener('drop', ev => {
			ev.stopPropagation();
			ev.preventDefault();

			this.importFromFiles(ev.dataTransfer.files);
		});
	},
	methods: {
		importMarkdown() {
			this.$el.querySelector('.import-and-exporter--input-file').click();
		},
		importFromFiles(files) {
			if (!files) {
				return;
			}

			if (files[0].type.startsWith('text/')) {
				const reader = new FileReader();
				reader.addEventListener('load', () => {
					this.$store.dispatch('import', reader.result);
				});
				reader.readAsText(files[0]);
			}

			if (files[0].type.startsWith('image/')) {
				const reader = new FileReader();
				reader.addEventListener('load', () => {
					this.$root.$emit('insert-image', { name: files[0].name, url: reader.result });
				});
				reader.readAsDataURL(files[0]);
			}
		},

		startDownload(filename, mimetype, data) {
			const elm = this.$el.querySelector('.import-and-exporter--download-link')
			elm.href = URL.createObjectURL(new Blob([ data ], { type: mimetype }));
			elm.download = filename;
			this.$el.querySelector('.import-and-exporter--download-link').click();
		},
		exportMarkdown() {
			this.startDownload(this.$store.getters.current_name + '.md', 'text/markdown', this.$store.state.current.markdown);
		},
		exportHTML() {
			this.startDownload(this.$store.getters.current_name + '.html', 'text/html', this.$store.getters.html);
		},
	},
};
</script>
