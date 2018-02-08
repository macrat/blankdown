import widgets from 'codemirror-widgets';

import ReWidgetMixIn from './ReWidgetMixIn.js';


export default function() {
	return widgets.createType({
		mixins: [
			new ReWidgetMixIn(/- \[([ xX])\](?= )/g, (cm, match, tokens) => {
				if (tokens.has('list')) {
					return {
						checked: match[1] !== ' ',
					};
				} else {
					return null;
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
			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			if (widget.props.checked) {
				checkbox.checked = 'checked';
			}
			checkbox.addEventListener('change', ev => {
				if (checkbox.checked) {
					widget.replace('- [x]');
				} else {
					widget.replace('- [ ]');
				}
			});
			return checkbox;
		},
	});
}
