import widgets from 'codemirror-widgets';

import ReWidgetMixIn from './ReWidgetMixIn.js';


export default function() {
	return widgets.createType({
		mixins: [
			new ReWidgetMixIn(/^---+$/gm, (cm, match, tokens) => {
				if (tokens.has('header-mark')) {
					return null;
				} else {
					return {};
				}
			}),
		],
		debounceWait: 10,
		findEditRange(range) {
			return {
				from: { line: range.from.line - 1, ch: 0 },
				to: { line: range.to.line + 1, ch: 0 },
			};
		},
		createElement(widget) {
			const hr = document.createElement('hr');
			hr.classList.add('hr-widget');
			return hr;
		},
	});
}
