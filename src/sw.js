const staticCacheName = 'reviews-v1';
const cacheItems = [
    '/',
    './css/mediaqueries.css',
    './css/restaurants.css',
    './css/styles.css',
    './restaurant.html',
    './index.html'
];

// Listen for when worker is installed, then cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(staticCacheName)
        .then(cache => cache.addAll(cacheItems))
        .catch(err => {
            console.error('Could not open cached items in sw', { staticCacheName, err });
        })
    );
});

// Delete old caches, but first check if it is one of ours.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
        .then(cacheNames => Promise.all(
            cacheNames.filter(cacheName => cacheName.startsWith('reviews-')
                 && cacheName != staticCacheName).map(cacheName => caches.delete(cacheName)),
        )
        ),
    );
});

// When site makes a fetch request 
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // if (requestUrl.origin === location.origin) {
    //     if (requestUrl.pathname === '/') {
    //         event.respondWith(caches.match('/skeleton'));

    //         return;
    //     }
    // }
    event.respondWith(
        caches.match(event.request, { ignoreSearch: true }).then(response => response || fetch(event.request)),
    );
});

self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
