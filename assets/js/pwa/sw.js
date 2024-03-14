---
layout: compress
permalink: /:basename.min.js
# PWA service worker
---

const swconfUrl = '{{ '/assets/js/data/swconf.js' | relative_url }}';

importScripts(swconfUrl);
const purge = swconf.purge;

function verifyHost(url) {
  for (const host of swconf.allowHosts) {
    const regex = RegExp(`^http(s)?://${host}/`);
    if (regex.test(url)) {
      return true;
    }
  }
  return false;
}

function verifyUrl(url) {
  if (!verifyHost(url)) {
    return false;
  }

  const requestPath = new URL(url).pathname;

  for (const path of swconf.denyPaths) {
    if (requestPath.startsWith(path)) {
      return false;
    }
  }
  return true;
}

if (!purge) {
  swconf.allowHosts.push(location.host);
}

self.addEventListener('install', (event) => {
  if (purge) {
    return;
  }

  event.waitUntil(
    caches.open(swconf.cacheName).then((cache) => {
      return cache.addAll(swconf.resources);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (purge) {
            return caches.delete(key);
          } else {
            if (key !== swconf.cacheName) {
              return caches.delete(key);
            }
          }
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) {
                return response;
            }

            return fetch(event.request).then(response => {
                const url = event.request.url;

<<<<<<< HEAD
                if (event.request.method !== 'GET' ||
                    !verifyDomain(url) ||
                    isExcluded(url)) {
                    return response;
                }

                /*
                  see: <https://developers.google.com/web/fundamentals/primers/service-workers#cache_and_return_requests>
                */
                let responseToCache = response.clone();

                caches.open(cacheName).then(cache => {
                    /* console.log('[sw] Caching new resource: ' + event.request.url); */
                    cache.put(event.request, responseToCache);
                });

                return response;
            });
        })
    );
=======
        if (purge || event.request.method !== 'GET' || !verifyUrl(url)) {
          return response;
        }

        {% comment %}See: <https://developers.google.com/web/fundamentals/primers/service-workers#cache_and_return_requests>{% endcomment %}
        let responseToCache = response.clone();

        caches.open(swconf.cacheName).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
>>>>>>> 0f8e782bfd5a3965278f5fc89d13a4082e98af36
});

