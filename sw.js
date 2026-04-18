const CACHE_NAME = 'society-tracker-final-v2'; 
const ASSETS = [
    './index.html',
    './css/style.css',
    './js/config.js',
    './js/app.js',
    './site.webmanifest',
    './icons/favicon-96x96.png',
    './icons/web-app-manifest-192x192.png',
    './icons/web-app-manifest-512x512.png'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Caching essential assets...');
            // addAll fail ho jata hai agar koi file missing ho, isliye careful rahein
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting(); // Naye worker ko turant activate karein
});

// Activate Service Worker (Purani cache saaf karein)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
});

// Fetch Assets
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});