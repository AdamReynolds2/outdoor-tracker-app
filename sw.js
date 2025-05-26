// Define the name of your cache
const CACHE_NAME = 'outdoor-tracker-cache-v1';

// List the files to cache (your app's "app shell")
const urlsToCache = [
    './', // Caches the index.html file itself
    'index.html',
    'https://cdn.tailwindcss.com', // Tailwind CSS CDN
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap', // Google Fonts CSS
    // Note: Firebase JS SDKs are imported as modules and are generally handled by the browser's HTTP cache.
    // Explicitly caching them here can sometimes lead to issues with updates if not managed carefully.
    // For simplicity and robustness, we'll rely on the browser's default caching for Firebase SDKs for now.
    // If you experience issues with Firebase not loading offline, you might need to reconsider caching these.
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
    // Only intercept requests for your app's assets.
    // For Firebase/Google API calls, we typically want these to go to the network directly
    // as they are dynamic and require live data/authentication.
    const requestUrl = new URL(event.request.url);

    // If it's a request for your app's HTML or other static assets
    if (urlsToCache.includes(requestUrl.pathname) || urlsToCache.includes(requestUrl.href)) {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    // Cache hit - return response
                    if (response) {
                        console.log('[Service Worker] Serving from cache:', requestUrl.pathname);
                        return response;
                    }
                    // No cache hit - fetch from network
                    console.log('[Service Worker] Fetching from network:', requestUrl.pathname);
                    return fetch(event.request);
                })
                .catch((error) => {
                    console.error('[Service Worker] Fetch failed:', error);
                    // You could return a fallback page here for offline
                    // return caches.match('/offline.html');
                })
        );
    } else if (requestUrl.origin === self.location.origin) {
        // For other local assets not explicitly listed in urlsToCache, try cache then network
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request);
            })
        );
    } else {
        // For all other requests (like Firebase API calls, external CDNs not cached),
        // let them go to the network directly.
        // This is crucial for Firebase to function correctly.
        event.respondWith(fetch(event.request));
    }
});
