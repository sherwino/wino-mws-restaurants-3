(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

var _this = void 0;

var staticCacheName = "reviews-v1";
var cacheItems = [// Added all of the PWA items that should be cached like icons, and manifest
"./", "./css/styles.css", "./css/restaurants.css", "./css/mediaqueries.css", "./restaurant.html", "./index.html", "./js/main.js", "./js/restaurant_info.js", "./manifest.json", "./img/icons/icon-72x72.png", "./img/icons/icon-96x96.png", "./img/icons/icon-128x128.png", "./img/icons/icon-144x144.png", "./img/icons/icon-152x152.png", "./img/icons/icon-192x192.png", "./img/icons/icon-384x384.png", "./img/icons/icon-512x512.png"]; // Listen for when worker is installed, then cache

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(staticCacheName).then(function (cache) {
    return cache.addAll(cacheItems);
  }).catch(function (err) {
    console.error("Could not open cached items in sw", {
      staticCacheName: staticCacheName,
      err: err
    });
  }));
}); // Delete old caches, but first check if it is one of ours.

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (cacheNames) {
    return Promise.all(cacheNames.filter(function (cacheName) {
      return cacheName.startsWith("reviews-") && cacheName !== staticCacheName;
    }).map(function (cacheName) {
      return caches.delete(cacheName);
    }));
  }));
}); // When site makes a fetch request
// Need to refactor this completely

self.addEventListener("fetch", function (event) {
  var requestUrl = new URL(event.request.url); // If the request was made from my site lets take a look at it

  if (requestUrl.origin === location.origin) {
    // So... for some reason the or statement I had before didn't work
    // Previously tried to catch review and restaurants in the same if statement
    // Now I am going to try to just do one for restaurants, and another for reviews
    //   if (requestUrl.pathname.includes("restaurants")) {
    //       event.respondWith(caches.match('/restaurant.html'));
    //   }
    //   if (requestUrl.pathname.includes("reviews")) {
    //     event.respondWith(caches.match('/restaurant.html'));
    //   }
    // I saw this elsewhere, my images are not showing up in offline mode going to try this
    if (requestUrl.pathname.endsWith(".jpg")) {
      event.respondWith(cachedImages(event.request));
    } else {
      // And respond with a cached version
      event.respondWith(caches.match(event.request, {
        ignoreSearch: true
      }).then(function (res) {
        return res || fetch(event.request);
      }));
    }
  }
}); // This should help me serve images when offline
// Also this is a mess, but I needed help
// I should refactor to async await or do something else 

function cachedImages(request) {
  var imgCacheName = "".concat(staticCacheName, "-img");
  var imgURL = request.url;
  imgURL = imgURL.replace(/-small\.\w{3}|-medium\.\w{3}|-large\.\w{3}/i, "");
  return caches.open(imgCacheName).then(function (imgCache) {
    return imgCache.match(imgURL).then(function (res) {
      return res || fetch(request);
    }).then(function (networkRes) {
      imgCache.put(imgURL, networkRes.clone());
      return networkRes;
    });
  });
}

self.addEventListener("message", function (event) {
  if (event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
}); // Is this even doing anything

self.addEventListener("sync", function (event) {
  if (event.tag === "restaurantSync") {
    event.waitUntil(_this.syncOfflineReviews());
  }
});

},{}]},{},[1])

//# sourceMappingURL=sw.js.map
