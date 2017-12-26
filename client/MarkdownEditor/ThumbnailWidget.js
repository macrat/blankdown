import widgets from 'codemirror-widgets';

import ReWidgetMixIn from './ReWidgetMixIn.js';


export default function() {
	return widgets.createType({
		mixins: [
			new ReWidgetMixIn(/!\[(.*?)\]\((.*?)\)/g, (cm, match, tokens) => {
				if (tokens.has('image')) {
					return {
						alt: match[1],
						src: match[2],
					};
				} else {
					return null;
				}
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
			img.classList.add('thumbnail-widget');
			img.classList.add('thumbnail-widget-image');
			img.addEventListener('error', function() {
				this.classList.add('thumbnail-widget-missing');
			});
			img.addEventListener('click', () => {
				widget.enter();
			});
			return img;
		},
	});
}
