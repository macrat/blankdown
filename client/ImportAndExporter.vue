<style scoped>
* {
	display: none;
}
</style>

<template>
	<div>
		<input
			class=import-and-exporter--input-file
			@change=inputChanged
			type=file
			accept="*.md" />

		<a class=import-and-exporter--download-link></a>
	</div>
</template>

<script>
export default {
	created() {
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
		inputChanged(ev) {
			this.importFromFiles(ev.target.files);
		},
		importFromFiles(files) {
			if (!files) {
				return;
			}

			if (files[0].type.startsWith('text/')) {
				this.$emit('import-start', files[0].name);

				const reader = new FileReader();
				reader.addEventListener('load', () => {
					this.$emit('imported', {
						filename: files[0].name,
						contents: reader.result,
					});
					this.$store.dispatch('import', reader.result);
				});
				reader.readAsText(files[0]);
			}

			if (files[0].type.startsWith('image/')) {
				this.$emit('image-load-start', files[0].name);

				const reader = new FileReader();
				reader.addEventListener('load', () => {
					this.$emit('image-loaded', {
						filename: files[0].name,
						url: reader.result,
					});
				});
				reader.readAsDataURL(files[0]);
			}
		},

		startDownload(filename, mimetype, data) {
			this.$emit('download-start', {
				filename: filename,
				type: mimetype,
				contents: data,
			});

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
