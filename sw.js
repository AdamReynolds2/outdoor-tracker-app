// Define the name of your cache
const CACHE_NAME = 'outdoor-tracker-cache-v2'; // Increment cache version for updates

// List the files to cache (your app's "app shell" and Firebase SDKs)
const urlsToCache = [
    './', // Caches the index.html file itself
    'index.html',
    'https://cdn.tailwindcss.com', // Tailwind CSS CDN
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap', // Google Fonts CSS

    // Firebase SDKs - Explicitly caching these is crucial for offline functionality
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js',
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js',
];

// 1. Install event: Caches all the necessary assets for the app shell
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('[Service Worker] Cache addAll failed:', error);
            })
    );
});

// 2. Activate event: Cleans up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 3. Fetch event: Intercepts network requests
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // Strategy: Cache-first for app shell and Firebase SDKs
    if (urlsToCache.includes(requestUrl.pathname) || urlsToCache.includes(requestUrl.href)) {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    // Cache hit - return response
                    if (response) {
                        console.log('[Service Worker] Serving from cache:', requestUrl.href);
                        return response;
                    }
                    // No cache hit - fetch from network
                    console.log('[Service Worker] Fetching from network (not in cache):', requestUrl.href);
                    return fetch(event.request);
                })
                .catch((error) => {
                    console.error('[Service Worker] Fetch failed for cached item:', error);
                    // You could return a fallback page here for offline if needed
                    // return caches.match('/offline.html');
                })
        );
    } else {
        // For all other requests (like dynamic Firebase API calls for Firestore data),
        // let them go to the network directly. Firebase SDK handles offline queuing internally.
        console.log('[Service Worker] Bypassing cache for network request:', requestUrl.href);
        event.respondWith(fetch(event.request));
    }
});
