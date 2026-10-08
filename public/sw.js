// FSEWWI Progressive Web App Service Worker (v3)
const CACHE_NAME = 'fsewwi-pwa-v3';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/logo.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
];

// Install Event - Pre-cache core shell assets safely without blocking
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        STATIC_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn('PWA pre-cache skipped for asset:', asset, err);
          })
        )
      );
    })
  );
});

// Activate Event - Immediately clean up any previous stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('PWA deleting outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Skip waiting message listener for instant client updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests or unsupported schemes
  if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 1. DO NOT intercept Vite dev server requests, ESM imports, or HMR modules
  if (
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules/') ||
    url.searchParams.has('t') ||
    url.searchParams.has('import') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx')
  ) {
    return; // Pass through to server directly
  }

  // 2. API calls: Network first, fall back to offline JSON response
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return new Response(
          JSON.stringify({
            error: 'You are currently offline. Please reconnect to access FSEWWI services.',
            offline: true,
          }),
          { headers: { 'Content-Type': 'application/json' }, status: 503 }
        );
      })
    );
    return;
  }

  // 3. Navigation requests (HTML pages): NETWORK FIRST
  // Always fetch fresh HTML from server first to prevent stale white-screen bugs,
  // falling back to cached shell if offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/', clone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedMatch = (await caches.match('/')) || (await caches.match('/index.html'));
          if (cachedMatch) return cachedMatch;

          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>FSEWWI Portal - Offline</title>
              <style>
                body { font-family: system-ui, sans-serif; background: #f8fafc; color: #0f172a; text-align: center; padding: 40px 20px; }
                .card { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
                h2 { color: #0f388a; margin-top: 10px; }
                button { background: #0f388a; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; cursor: pointer; margin-top: 15px; }
              </style>
            </head>
            <body>
              <div class="card">
                <h2>FSEWWI Portal</h2>
                <p>You appear to be offline. Reconnect to the internet and tap reload.</p>
                <button onclick="window.location.reload()">Reload Portal</button>
              </div>
            </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html' }, status: 200 }
          );
        })
    );
    return;
  }

  // 4. Static assets & fonts: Cache-First with Network fallback
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.pathname.match(/\.(png|svg|jpg|jpeg|webp|ico|woff|woff2|css|js)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return networkResponse;
          })
          .catch(() => {
            return new Response('', { status: 408 });
          });
      })
    );
    return;
  }

  // 5. Default: Network with cache fallback
  event.respondWith(
    fetch(event.request).catch(async () => {
      const match = await caches.match(event.request);
      if (match) return match;
      throw new Error('Offline and asset not cached');
    })
  );
});
