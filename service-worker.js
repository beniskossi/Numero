const CACHE_NAME = 'numero-cache-v1';
const urlsToCache = [
    '/Numero/',
    '/Numero/index.html',
    '/Numero/styles.css',
    '/Numero/app.js',
    '/Numero/manifest.json'
    // Ajoutez '/Numero/icon.png' si vous avez une icône
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
