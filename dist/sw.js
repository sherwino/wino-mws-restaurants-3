(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var staticCacheName = 'reviews-v1';
var cacheItems = ['./', './css/mediaqueries.css', './css/restaurants.css', './css/styles.css', './restaurant.html', './index.html']; // Listen for when worker is installed, then cache

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(staticCacheName).then(function (cache) {
    return cache.addAll(cacheItems);
  }).catch(function (err) {
    console.error('Could not open cached items in sw', {
      staticCacheName: staticCacheName,
      err: err
    });
  }));
}); // Delete old caches, but first check if it is one of ours.

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (cacheNames) {
    return Promise.all(cacheNames.filter(function (cacheName) {
      return cacheName.startsWith('reviews-') && cacheName != staticCacheName;
    }).map(function (cacheName) {
      return caches.delete(cacheName);
    }));
  }));
}); // When site makes a fetch request 

self.addEventListener('fetch', function (event) {
  var requestUrl = new URL(event.request.url); // if (requestUrl.origin === location.origin) {
  //     if (requestUrl.pathname === '/') {
  //         event.respondWith(caches.match('/skeleton'));
  //         return;
  //     }
  // }

  event.respondWith(caches.match(event.request, {
    ignoreSearch: true
  }).then(function (response) {
    return response || fetch(event.request);
  }));
});
self.addEventListener('message', function (event) {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

},{}]},{},[1])

//# sourceMappingURL=sw.js.map
