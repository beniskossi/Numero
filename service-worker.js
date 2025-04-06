const CACHE_NAME = 'numero-cache-v1';
const urlsToCache = [
    '/Numero/',
    '/Numero/index.html',
    '/Numero/styles.css',
    '/Numero/app.js',
    '/Numero/manifest.json',
    '/Numero/icon.png' 
    // Retirez '/Numero/icon.png' pour l'instant, car le fichier n'existe pas
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
