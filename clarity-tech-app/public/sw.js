/**
 * Service Worker for Clarity Pool Services
 * Handles offline functionality, caching, and background sync
 */

const CACHE_NAME = 'clarity-pool-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Static assets to cache
const STATIC_CACHE_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  OFFLINE_URL,
];

// API endpoints that should be cached
const API_CACHE_PATTERNS = [
  /\/api\/user\/profile/,
  /\/api\/customers\/list/,
  /\/api\/reports\/list/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

/**
 * Handle API requests with network-first strategy
 */
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses for specific endpoints
    if (networkResponse.ok && shouldCacheApiResponse(url.pathname)) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for', url.pathname);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API calls
    return new Response(
      JSON.stringify({
        success: false,
        error: 'No network connection',
        offline: true,
        message: 'Please check your internet connection and try again.',
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

/**
 * Handle static asset requests with cache-first strategy
 */
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Try network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Failed to load', request.url);
    
    // For navigation requests, return offline page
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    // For other requests, return a simple offline response
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Check if API response should be cached
 */
function shouldCacheApiResponse(pathname) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(pathname));
}

// Background sync for offline queue
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'offline-sync') {
    event.waitUntil(syncOfflineQueue());
  }
});

/**
 * Sync offline queue when connection is restored
 */
async function syncOfflineQueue() {
  try {
    console.log('Service Worker: Starting offline queue sync');
    
    // Get offline queue from IndexedDB or send message to main thread
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_OFFLINE_QUEUE',
        timestamp: Date.now(),
      });
    });
    
    console.log('Service Worker: Offline queue sync initiated');
  } catch (error) {
    console.error('Service Worker: Offline queue sync failed', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  let notificationData = {
    title: 'Clarity Pool Services',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'clarity-notification',
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Service Worker: Failed to parse push data', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Open App',
        },
        {
          action: 'close',
          title: 'Dismiss',
        },
      ],
    })
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise, open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_UPDATE':
      updateCache(data);
      break;
      
    case 'CLEAR_CACHE':
      clearCache();
      break;
      
    default:
      console.log('Service Worker: Unknown message type', type);
  }
});

/**
 * Update cache with new data
 */
async function updateCache(data) {
  try {
    const cache = await caches.open(CACHE_NAME);
    
    if (data.url && data.response) {
      await cache.put(data.url, new Response(JSON.stringify(data.response)));
      console.log('Service Worker: Cache updated for', data.url);
    }
  } catch (error) {
    console.error('Service Worker: Cache update failed', error);
  }
}

/**
 * Clear all caches
 */
async function clearCache() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('Service Worker: All caches cleared');
  } catch (error) {
    console.error('Service Worker: Cache clearing failed', error);
  }
}

// Log service worker status
console.log('Service Worker: Script loaded');