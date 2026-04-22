// Version bump: v2 se v3 kiya taaki browser ko naya update dikhe
const CACHE_NAME = 'society-tracker-final-v3'; 
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
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting(); // Naye worker ko line mein lagne se rokta hai
});

// Activate Service Worker (Isme badlav kiya hai)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // 1. Purani caches saaf karein
            caches.keys().then((keys) => {
                return Promise.all(
                    keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
                );
            }),
            // 2. Turant control lein (Naya added)
            self.clients.claim()
        ])
    );
});

// Fetch Assets (Cache First Strategy)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});