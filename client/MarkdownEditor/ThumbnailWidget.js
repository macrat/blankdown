import widgets from 'codemirror-widgets';
import axios from 'axios';

import ReWidgetMixIn from './ReWidgetMixIn.js';


export default function() {
	return widgets.createType({
		mixins: [
			new ReWidgetMixIn(/!\[(.*?)\]\((.*?)\)/g, (cm, match, tokens) => {
				if (tokens.has('media')) {
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
		findEditRange(range) {
			return {
				from: { line: range.from.line - 1, ch: 0 },
				to: { line: range.to.line + 1, ch: 0 },
			};
		},
		createElement(widget) {
			if (widget.props.src.startsWith('https://www.youtube.com/watch')) {
				return this.createYoutubeElement(widget);
			} else if (widget.props.src.startsWith('https://soundcloud.com/')) {
				return this.createSoundCloudElement(widget);
			} else if (widget.props.src.startsWith('https://vimeo.com/')) {
				return this.createVimeoElement(widget);
			} else {
				return this.createImageElement(widget);
			}
		},
		createImageElement(widget) {
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
		createYoutubeElement(widget) {
			const iframe = document.createElement('iframe');
			iframe.innerText = widget.props.alt;
			iframe.title = widget.props.alt;
			iframe.width = 640;
			iframe.height = 360;

			iframe.classList.add('thumbnail-widget');
			iframe.classList.add('thumbnail-widget-video');

			const url = new URL(widget.props.src);
			const v = url.search.slice(1).split('&').map(x => x.split('=')).filter(xs => xs[0] === 'v');
			if (!v || !v[0][1]) {
				this.classList.add('thumbnail-widget-missing');
				return iframe;
			}

			iframe.src = 'https://www.youtube.com/embed/' + v[0][1];
			iframe.gesture = 'media';
			iframe.allow = 'encrypted-media';
			iframe.allowFullscreen = true;

			return iframe;
		},
		createSoundCloudElement(widget) {
			const outer = document.createElement('div');
			outer.innerText = widget.props.alt;
			outer.title = widget.props.alt;

			outer.classList.add('thumbnail-widget');
			outer.classList.add('thumbnail-widget-sound');
			outer.classList.add('thumbnail-widget-missing');

			axios.get('https://soundcloud.com/oembed', { params: { url: widget.props.src, format: 'json' } })
				.then(result => {
					outer.innerHTML = result.data.html;
					outer.classList.remove('thumbnail-widget-missing');
					const iframe = outer.querySelector('iframe');
					iframe.width = 640;
					iframe.height = 200;
				})
				.catch(err => {
					console.error('failed load SoundCloud:', widget.props, err);
					outer.classList.add('thumbnail-widget-missing');
				})

			return outer;
		},
		createVimeoElement(widget) {
			const iframe = document.createElement('iframe');
			iframe.innerText = widget.props.alt;
			iframe.title = widget.props.alt;
			iframe.width = 640;
			iframe.height = 360;

			iframe.classList.add('thumbnail-widget');
			iframe.classList.add('thumbnail-widget-video');

			const url = new URL(widget.props.src);

			iframe.src = 'https://player.vimeo.com/video' + url.pathname;
			iframe.gesture = 'media';
			iframe.allow = 'encrypted-media';
			iframe.allowFullscreen = true;

			return iframe;
		},
	});
}
