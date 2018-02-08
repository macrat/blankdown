import widgets from 'codemirror-widgets';

import ReWidgetMixIn from './ReWidgetMixIn.js';


export default function() {
	return widgets.createType({
		mixins: [
			new ReWidgetMixIn(/^---+$/gm, (cm, match, tokens) => {
				if (tokens.has('horizontal-line')) {
					return {};
				} else {
					return null;
				}
			}),
		],
		debounceWait: 500,
		findEditRange(range) {
			return {
				from: { line: range.from.line - 1, ch: 0 },
				to: { line: range.to.line + 1, ch: 0 },
			};
		},
		createElement(widget) {
			const hr = document.createElement('hr');
			hr.classList.add('horizontal-line-widget');
			return hr;
		},
	});
}
