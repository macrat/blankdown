import widgets from 'codemirror-widgets';

import ReWidgetMixIn from './ReWidgetMixIn.js';


export default function(onCreated) {
	return widgets.createType({
		mixins: [
			new ReWidgetMixIn(/^\[toc\]$/gim, (cm, match, tokens) => {
				if (tokens.has('toc')) {
					return {};
				} else {
					return null;
				}
			}),
		],
		debounceWait: 10,
		findEditRange: function(range) {
			return {
				from: { line: range.from.line - 1, ch: 0 },
				to: { line: range.to.line + 1, ch: 0 },
			};
		},
		createElement: function(widget) {
			const toc = document.createElement('div');
			toc.classList.add('toc-widget');
			onCreated(toc);
			return toc;
		},
	});
}
