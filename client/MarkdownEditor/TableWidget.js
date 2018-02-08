import widgets from 'codemirror-widgets';

import ReWidgetMixIn from './ReWidgetMixIn.js';


export default function() {
	return widgets.createType({
		mixins: [
			new ReWidgetMixIn(/(\|(?:[^|\n]*\|)+)\n[ \t]*(\|(?::?-+:?\|)+)((?:\n[ \t]*\|(?:[^|\n]*\|)+)+)(?=[ \t]*(?:\n|$))/g, (cm, match, tokens) => {
				return {
					headers: match[1].trim().replace(/^\||\|$/g, '').split('|').map(x => x.trim()),
					aligns: match[2].trim().replace(/^\||\|$/g, '').split('|').map(x => {
						x = x.trim();
						if (x.startsWith(':') && x.endsWith(':')) {
							return 'center';
						}
						if (x.startsWith(':')) {
							return 'left';
						}
						if (x.endsWith(':')) {
							return 'right';
						}
						return null;
					}),
					contents: match[3].trim().split('\n').map(xs => {
						return xs.trim().replace(/^\||\|$/g, '').split('|').map(x => x.trim());
					}),
				};
			}),
		],
		debounceWait: 10,
		findEditRange(range) {
			return {
				from: { line: range.from.line - 10, ch: 0 },
				to: { line: range.to.line + 10, ch: 0 },
			};
		},
		createElement(widget) {
			const wrapper = document.createElement('span');
			wrapper.classList.add('table-widget');

			const table = document.createElement('table');
			wrapper.appendChild(table);

			const header = document.createElement('tr');
			table.appendChild(header)
			widget.props.headers.forEach(x => {
				const elm = document.createElement('th');
				elm.innerText = x;
				header.appendChild(elm);
			});

			widget.props.contents.forEach(xs => {
				const row = document.createElement('tr');
				table.appendChild(row);
				xs.forEach((x, idx) => {
					const elm = document.createElement('td');
					elm.innerText = x;

					const align = widget.props.aligns[idx];
					if (align) {
						elm.classList.add('table-widget--align-' + align);
					}

					row.appendChild(elm);
				});
			});

			return wrapper;
		},
	});
}
