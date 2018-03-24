const CACHE_NAME = 'blankdown-' + VERSION_CODE;


self.addEventListener('install', ev => {
	ev.waitUntil(
		caches.open(CACHE_NAME)
			.then(cache => cache.addAll(['/', '/app.js'].map(x => new Request(location.origin + x, { cache: 'no-cache', redirect: 'follow' }))))
			.then(() => self.skipWaiting())
	);
});


self.addEventListener('activate', ev => {
	ev.waitUntil(
		caches.keys()
			.then(keys => keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
			.then(() => self.clients.claim())
	);
});


self.addEventListener('fetch', ev => {
	ev.respondWith(caches.match(ev.request).then(response => {
		if (response) {
			return response;
		}

		const url = new URL(ev.request.url);

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


self.addEventListener('message', ev => {
	self.clients.matchAll().then(clients => clients.forEach(client => {
		if (client.id !== ev.source.id) {
			client.postMessage(ev.data);
		}
	}));
});
