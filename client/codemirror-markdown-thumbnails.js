import widgets from 'codemirror-widgets';


export default widgets.createType({
	mixins: [
		widgets.mixins.re(/!\[(.*?)\]\((.*?)\)/g, match => {
			return {
				props: {
					alt: match[1],
					src: match[2],
				},
			};
		}),
	],
	debounceWait: 10,
	findEditRange: function(range) {
		const ret = {
			from: { line: range.from.line - 1, ch: 0 },
			to: { line: range.to.line + 1, ch: 0 },
		};
		return ret;
	},
	createElement: function(widget) {
		const img = document.createElement('img');
		img.src = widget.props.src;
		img.alt = widget.props.alt;
		img.title = widget.props.alt;
		img.classList.add('cm-thumbnail');
		img.classList.add('cm-thumbnail-image');
		img.addEventListener('error', function() {
			this.classList.add('cm-thumbnail-missing');
		});
		return img;
	},
});
