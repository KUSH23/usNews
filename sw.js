const cacheName = 'news-v1';
const offlineUrl = './';
const staticAssets = [
  './',
  './app.js',
  './styles.css',
  './fallback.json',
  './images/fetch-dog.jpg'
];




self.addEventListener("install", event => {
  console.log("Service worker added");
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      cache.addAll(staticAssets);
    })
  );
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  console.log("Service worker activate triggered");
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin === location.origin) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  return cachedResponse || fetch(request);
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (err) {
    const cachedResponse = await cacheName.match(request);
    return cachedResponse || await caches.match('./fallback.json');
  }
}

self.addEventListener("push", function(event) {
  var body;
  if (event.data) {
    body = event.data.text();
    console.log("Push event!! ", event.data.text());
  } else {
    console.log("Push event but no data");
  }
  var options = {
    body: body,
    icon: '/images/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {action: 'explore', title: 'Explore this new world',
        icon: 'images/icons/icon-192x192.png'},
      {action: 'close', title: 'I don\'t want any of this',
        icon: 'images/fetch-dog.jpg'},
    ]
  };
  event.waitUntil(
    self.registration.showNotification('Push Notification', options)
  );
});


self.addEventListener('notificationclose', function(e) {
  var notification = e.notification;
  var primaryKey = notification.data.primaryKey;

  console.log('Closed notification: ' + primaryKey);
});

self.addEventListener('notificationclick', function(e) {
  var notification = e.notification;
  var primaryKey = notification.data.primaryKey;
  var action = e.action;

  if (action === 'close') {
    notification.close();
  } else {
    clients.openWindow('https://kush23.github.io/profile');
    notification.close();
  }
});