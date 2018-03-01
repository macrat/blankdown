const CACHE_NAME = 'blankdown-' + VERSION_CODE;


self.addEventListener('install', ev => {
	ev.waitUntil(caches.open(CACHE_NAME).then(cache => {
		return cache.addAll(['/', '/app.js', '/MarkdownEditor.js', '/manifest.json'].map(x => new Request(location.origin + x, { cache: 'no-cache', redirect: 'follow' })));
	}));
});


self.addEventListener('activate', ev => {
	ev.waitUntil(caches.keys().then(keys => {
		return keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key));
	}));
});


self.addEventListener('fetch', ev => {
	ev.respondWith(caches.match(ev.request).then(response => {
		if (response) {
			return response;
		}

		const url = new URL(ev.request.url);

		if (url.hostname.endsWith('.auth0.com')) {
			return fetch(ev.request);
		}

		if (url.origin !== location.origin) {
			return fetch(ev.request, {
				mode: 'no-cors',
				credentials: 'omit',
				redirect: 'follow',
			});
		}

		if (/^\/[^\/.]+$/.test(url.pathname)) {
			return caches.match(new Request('/'));
		}

		return fetch(ev.request);
	}));
});
