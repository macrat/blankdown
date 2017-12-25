const CACHE_NAME = 'blankdown-v1';


self.addEventListener('install', ev => {
	ev.waitUntil(caches.open(CACHE_NAME).then(cache => {
		return cache.addAll(['/', '/app.js', '/manifest.json']);
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
