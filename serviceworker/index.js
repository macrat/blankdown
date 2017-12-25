const CACHE_NAME = 'blankdown-' + VERSION_CODE;


self.addEventListener('install', ev => {
	ev.waitUntil(caches.open(CACHE_NAME).then(cache => {
		return cache.addAll(['/', '/app.js', '/MarkdownEditor.js', '/manifest.json']);
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

		if (/^\/[^\/.]+$/.test(new URL(ev.request.url).pathname)) {
			return caches.match(new Request('/'));
		}

		return fetch(ev.request);
	}));
});
