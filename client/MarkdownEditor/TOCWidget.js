import widgets from 'codemirror-widgets';


export default function(onCreated) {
	return widgets.createType({
		mixins: [
			widgets.mixins.re(/^\[toc\]$/gim, match => {
				return {};
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
			const toc = document.createElement('div');
			toc.innerHTML = '<span class=toc-widget-title>ToC</span><div class=toc-widget-content></div>';
			toc.classList.add('toc-widget');
			onCreated(toc);
			return toc;
		},
	});
}
