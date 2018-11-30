(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

(function() {
  function toArray(arr) {
    return Array.prototype.slice.call(arr);
  }

  function promisifyRequest(request) {
    return new Promise(function(resolve, reject) {
      request.onsuccess = function() {
        resolve(request.result);
      };

      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  function promisifyRequestCall(obj, method, args) {
    var request;
    var p = new Promise(function(resolve, reject) {
      request = obj[method].apply(obj, args);
      promisifyRequest(request).then(resolve, reject);
    });

    p.request = request;
    return p;
  }

  function promisifyCursorRequestCall(obj, method, args) {
    var p = promisifyRequestCall(obj, method, args);
    return p.then(function(value) {
      if (!value) return;
      return new Cursor(value, p.request);
    });
  }

  function proxyProperties(ProxyClass, targetProp, properties) {
    properties.forEach(function(prop) {
      Object.defineProperty(ProxyClass.prototype, prop, {
        get: function() {
          return this[targetProp][prop];
        },
        set: function(val) {
          this[targetProp][prop] = val;
        }
      });
    });
  }

  function proxyRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function proxyMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return this[targetProp][prop].apply(this[targetProp], arguments);
      };
    });
  }

  function proxyCursorRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyCursorRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function Index(index) {
    this._index = index;
  }

  proxyProperties(Index, '_index', [
    'name',
    'keyPath',
    'multiEntry',
    'unique'
  ]);

  proxyRequestMethods(Index, '_index', IDBIndex, [
    'get',
    'getKey',
    'getAll',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(Index, '_index', IDBIndex, [
    'openCursor',
    'openKeyCursor'
  ]);

  function Cursor(cursor, request) {
    this._cursor = cursor;
    this._request = request;
  }

  proxyProperties(Cursor, '_cursor', [
    'direction',
    'key',
    'primaryKey',
    'value'
  ]);

  proxyRequestMethods(Cursor, '_cursor', IDBCursor, [
    'update',
    'delete'
  ]);

  // proxy 'next' methods
  ['advance', 'continue', 'continuePrimaryKey'].forEach(function(methodName) {
    if (!(methodName in IDBCursor.prototype)) return;
    Cursor.prototype[methodName] = function() {
      var cursor = this;
      var args = arguments;
      return Promise.resolve().then(function() {
        cursor._cursor[methodName].apply(cursor._cursor, args);
        return promisifyRequest(cursor._request).then(function(value) {
          if (!value) return;
          return new Cursor(value, cursor._request);
        });
      });
    };
  });

  function ObjectStore(store) {
    this._store = store;
  }

  ObjectStore.prototype.createIndex = function() {
    return new Index(this._store.createIndex.apply(this._store, arguments));
  };

  ObjectStore.prototype.index = function() {
    return new Index(this._store.index.apply(this._store, arguments));
  };

  proxyProperties(ObjectStore, '_store', [
    'name',
    'keyPath',
    'indexNames',
    'autoIncrement'
  ]);

  proxyRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'put',
    'add',
    'delete',
    'clear',
    'get',
    'getAll',
    'getKey',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'openCursor',
    'openKeyCursor'
  ]);

  proxyMethods(ObjectStore, '_store', IDBObjectStore, [
    'deleteIndex'
  ]);

  function Transaction(idbTransaction) {
    this._tx = idbTransaction;
    this.complete = new Promise(function(resolve, reject) {
      idbTransaction.oncomplete = function() {
        resolve();
      };
      idbTransaction.onerror = function() {
        reject(idbTransaction.error);
      };
      idbTransaction.onabort = function() {
        reject(idbTransaction.error);
      };
    });
  }

  Transaction.prototype.objectStore = function() {
    return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments));
  };

  proxyProperties(Transaction, '_tx', [
    'objectStoreNames',
    'mode'
  ]);

  proxyMethods(Transaction, '_tx', IDBTransaction, [
    'abort'
  ]);

  function UpgradeDB(db, oldVersion, transaction) {
    this._db = db;
    this.oldVersion = oldVersion;
    this.transaction = new Transaction(transaction);
  }

  UpgradeDB.prototype.createObjectStore = function() {
    return new ObjectStore(this._db.createObjectStore.apply(this._db, arguments));
  };

  proxyProperties(UpgradeDB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(UpgradeDB, '_db', IDBDatabase, [
    'deleteObjectStore',
    'close'
  ]);

  function DB(db) {
    this._db = db;
  }

  DB.prototype.transaction = function() {
    return new Transaction(this._db.transaction.apply(this._db, arguments));
  };

  proxyProperties(DB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(DB, '_db', IDBDatabase, [
    'close'
  ]);

  // Add cursor iterators
  // TODO: remove this once browsers do the right thing with promises
  ['openCursor', 'openKeyCursor'].forEach(function(funcName) {
    [ObjectStore, Index].forEach(function(Constructor) {
      // Don't create iterateKeyCursor if openKeyCursor doesn't exist.
      if (!(funcName in Constructor.prototype)) return;

      Constructor.prototype[funcName.replace('open', 'iterate')] = function() {
        var args = toArray(arguments);
        var callback = args[args.length - 1];
        var nativeObject = this._store || this._index;
        var request = nativeObject[funcName].apply(nativeObject, args.slice(0, -1));
        request.onsuccess = function() {
          callback(request.result);
        };
      };
    });
  });

  // polyfill getAll
  [Index, ObjectStore].forEach(function(Constructor) {
    if (Constructor.prototype.getAll) return;
    Constructor.prototype.getAll = function(query, count) {
      var instance = this;
      var items = [];

      return new Promise(function(resolve) {
        instance.iterateCursor(query, function(cursor) {
          if (!cursor) {
            resolve(items);
            return;
          }
          items.push(cursor.value);

          if (count !== undefined && items.length == count) {
            resolve(items);
            return;
          }
          cursor.continue();
        });
      });
    };
  });

  var exp = {
    open: function(name, version, upgradeCallback) {
      var p = promisifyRequestCall(indexedDB, 'open', [name, version]);
      var request = p.request;

      if (request) {
        request.onupgradeneeded = function(event) {
          if (upgradeCallback) {
            upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction));
          }
        };
      }

      return p.then(function(db) {
        return new DB(db);
      });
    },
    delete: function(name) {
      return promisifyRequestCall(indexedDB, 'deleteDatabase', [name]);
    }
  };

  if (typeof module !== 'undefined') {
    module.exports = exp;
    module.exports.default = module.exports;
  }
  else {
    self.idb = exp;
  }
}());

},{}],2:[function(require,module,exports){
"use strict";

var usersBrowser;
var _navigator = navigator,
    userAgent = _navigator.userAgent; // The order matters here, and this may report false positives for unlisted browsers.

if (userAgent.indexOf('Firefox') > -1) {
  usersBrowser = 'Mozilla Firefox';
} else if (userAgent.indexOf('Opera') > -1) {
  usersBrowser = 'Opera';
} else if (userAgent.indexOf('Trident') > -1) {
  usersBrowser = 'Microsoft Internet Explorer';
} else if (userAgent.indexOf('Edge') > -1) {
  usersBrowser = 'Microsoft Edge';
} else if (userAgent.indexOf('Chrome') > -1) {
  usersBrowser = 'Google Chrome or Chromium';
} else if (userAgent.indexOf('Safari') > -1) {
  usersBrowser = 'Apple Safari';
} else {
  usersBrowser = 'unknown';
}

console.log("You are using: ".concat(usersBrowser));

},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _dbpromise = _interopRequireDefault(require("./dbpromise"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * Common database helper functions.
 */
var DBHelper =
/*#__PURE__*/
function () {
  function DBHelper() {
    _classCallCheck(this, DBHelper);
  }

  _createClass(DBHelper, null, [{
    key: "fetchRestaurants",

    /**
     * Fetch all restaurants.
     */
    value: function fetchRestaurants(callback) {
      this.syncOfflinefav();
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "".concat(DBHelper.API_URL, "/restaurants"));

      xhr.onload = function () {
        if (xhr.status === 200) {
          var restaurants = JSON.parse(xhr.responseText);

          _dbpromise.default.putRestaurants(restaurants);

          callback(null, restaurants);
        } else {
          // Oops!. Got an error from server.
          console.log("Request failed. Returned status of ".concat(xhr.status, ", trying idb...")); // if xhr request isn't code 200, try idb

          _dbpromise.default.getRestaurants().then(function (idbRestaurants) {
            if (idbRestaurants.length) {
              callback(null, idbRestaurants);
            } else {
              callback("No restaurants found in idb", null);
            }
          });
        }
      }; // XHR needs error handling for when server is down (doesn't respond or sends back codes)


      xhr.onerror = function () {
        console.log("Error while trying XHR, trying idb..."); // try idb, and if we get restaurants back, return them, otherwise return an error

        _dbpromise.default.getRestaurants().then(function (idbRestaurants) {
          if (idbRestaurants.length) {
            callback(null, idbRestaurants);
          } else {
            callback("No restaurants found in idb", null);
          }
        });
      };

      xhr.send();
    }
    /**
     * Fetch a restaurant by its ID.
     */

  }, {
    key: "fetchRestaurantById",
    value: function fetchRestaurantById(id, callback) {
      this.syncOfflineReviews();
      fetch("".concat(DBHelper.API_URL, "/restaurants/").concat(id)).then(function (response) {
        if (!response.ok) return Promise.reject("Restaurant couldn't be fetched from network");
        return response.json();
      }).then(function (fetchedRestaurant) {
        // if restaurant could be fetched from network:
        _dbpromise.default.putRestaurants(fetchedRestaurant);

        return callback(null, fetchedRestaurant);
      }).catch(function (networkError) {
        // if restaurant couldn't be fetched from network:
        console.log("".concat(networkError, ", trying idb."));

        _dbpromise.default.getRestaurants(id).then(function (idbRestaurant) {
          if (!idbRestaurant) return callback("Restaurant not found in idb either", null);
          return callback(null, idbRestaurant);
        });
      });
    }
    /**
     * Fetch restaurant reviews by restaurant id.
     */

  }, {
    key: "fetchsReviewsByRestaurantId",
    value: function fetchsReviewsByRestaurantId(id) {
      return _dbpromise.default.getReviewsForRestaurant(id).then(function (idbReviews) {
        if (!idbReviews.length) {
          console.info("No reviews in idb", idbReviews);
          console.info("Fetching from API");
          return fetch("".concat(DBHelper.API_URL, "/reviews/?restaurant_id=").concat(id)).then(function (response) {
            return response.json();
          }).then(function (fetchedReviews) {
            console.info("Found Reviews saving to idb");

            _dbpromise.default.putReviews(fetchedReviews);

            return fetchedReviews;
          }).catch(function (err) {
            console.error("Reviews couldn't be fetched from network, sorry.");
          });
        } else {
          console.info("Found reviews on idb");
          return idbReviews;
        }
      });
    }
    /**
     * I have an idb collection of offline messages that need to get online
     */

  }, {
    key: "syncOfflineReviews",
    value: function syncOfflineReviews() {
      return _dbpromise.default.getOfflineReviews().then(function (reviews) {
        // If we actually got some reviews, send them to idb, not sure if I send whole object
        if (reviews) {
          var url = "".concat(DBHelper.API_URL, "/reviews/");
          var POST = {
            method: "POST",
            body: JSON.stringify(reviews)
          };
          return fetch(url, POST).then(function (response) {
            if (!response.ok) {
              return Promise.reject("We couldn't post review to server.");
            }

            console.info("Posted offline reviews to api successfully");
            return response.json();
          });
        }

        return null;
      });
    }
    /**
    * I have an idb collection of offline messages that need to get online
    */

  }, {
    key: "syncOfflinefav",
    value: function syncOfflinefav() {
      return _dbpromise.default.getOfflinefavs().then(function (favs) {
        // If we actually got some favs, send them to idb
        if (favs) {
          var url = "".concat(DBHelper.API_URL, "/restaurants/").concat(restaurantId, "/?is_favorite=").concat(!fav);
          var PUT = {
            method: "PUT"
          };
          return fetch(url, PUT).then(function (response) {
            if (!response.ok) {
              return Promise.reject("We couldn't post fav to server.");
            }

            console.info("Posted offline favs to api successfully");
            return response.json();
          });
        }

        return null;
      });
    }
    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */

  }, {
    key: "fetchRestaurantByCuisine",
    value: function fetchRestaurantByCuisine(cuisine, callback) {
      // Fetch all restaurants  with proper error handling
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Filter restaurants to have only given cuisine type
          var results = restaurants.filter(function (r) {
            return r.cuisine_type == cuisine;
          });
          callback(null, results);
        }
      });
    }
    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */

  }, {
    key: "fetchRestaurantByNeighborhood",
    value: function fetchRestaurantByNeighborhood(neighborhood, callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Filter restaurants to have only given neighborhood
          var results = restaurants.filter(function (r) {
            return r.neighborhood == neighborhood;
          });
          callback(null, results);
        }
      });
    }
    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */

  }, {
    key: "fetchRestaurantByCuisineAndNeighborhood",
    value: function fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          var results = restaurants;

          if (cuisine != "all") {
            // filter by cuisine
            results = results.filter(function (r) {
              return r.cuisine_type == cuisine;
            });
          }

          if (neighborhood != "all") {
            // filter by neighborhood
            results = results.filter(function (r) {
              return r.neighborhood == neighborhood;
            });
          }

          callback(null, results);
        }
      });
    }
    /**
     * Fetch all neighborhoods with proper error handling.
     */

  }, {
    key: "fetchNeighborhoods",
    value: function fetchNeighborhoods(callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Get all neighborhoods from all restaurants
          var neighborhoods = restaurants.map(function (v, i) {
            return restaurants[i].neighborhood;
          }); // Remove duplicates from neighborhoods

          var uniqueNeighborhoods = neighborhoods.filter(function (v, i) {
            return neighborhoods.indexOf(v) == i;
          });
          callback(null, uniqueNeighborhoods);
        }
      });
    }
    /**
     * Fetch all cuisines with proper error handling.
     */

  }, {
    key: "fetchCuisines",
    value: function fetchCuisines(callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Get all cuisines from all restaurants
          var cuisines = restaurants.map(function (v, i) {
            return restaurants[i].cuisine_type;
          }); // Remove duplicates from cuisines

          var uniqueCuisines = cuisines.filter(function (v, i) {
            return cuisines.indexOf(v) == i;
          });
          callback(null, uniqueCuisines);
        }
      });
    }
    /**
     * Restaurant page URL.
     */

  }, {
    key: "urlForRestaurant",
    value: function urlForRestaurant(restaurant) {
      return "./restaurant.html?id=".concat(restaurant.id);
    }
    /**
     * Restaurant image URL.
     */

  }, {
    key: "imageUrlForRestaurant",
    value: function imageUrlForRestaurant(restaurant) {
      var url = "./img/".concat(restaurant.photograph || restaurant.id, "-medium.jpg");
      return url;
    }
    /**
     * Restaurant srcset attribute for browser to decide best resolution. It uses restaurant.photograph
     * and fallbacks to restaurant.id if former is missing.
     */

  }, {
    key: "imageSrcsetForRestaurant",
    value: function imageSrcsetForRestaurant(restaurant) {
      var imageSrc = "./img/".concat(restaurant.photograph || restaurant.id);
      return "".concat(imageSrc, "-small.jpg 300w,\n            ").concat(imageSrc, "-medium.jpg 600w,\n            ").concat(imageSrc, "-large.jpg 800w");
    }
    /**
     * Restaurant sizes attribute so browser knows image sizes before deciding
     * what image to download.
     */

  }, {
    key: "imageSizesForRestaurant",
    value: function imageSizesForRestaurant(restaurant) {
      return "(max-width: 360px) 280px,\n            (max-width: 600px) 600px,\n            400px";
    }
  }, {
    key: "mapMarkerForRestaurant",
    value: function mapMarkerForRestaurant(restaurant, map) {
      var marker = new google.maps.Marker({
        position: restaurant.latlng,
        title: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant),
        map: map,
        animation: google.maps.Animation.DROP
      });
      return marker;
    }
  }, {
    key: "API_URL",

    /**
     * API URL
     */
    get: function get() {
      var port = 1337; // port where sails server will listen.

      var heroku = "https://winosails.herokuapp.com";

      var isLocalHost = function isLocalHost() {
        if (window.location.hostname.includes("localhost")) {
          return "http://localhost:".concat(port);
        }
      };

      var url = isLocalHost() || heroku;
      return url;
    }
  }]);

  return DBHelper;
}();

exports.default = DBHelper;

},{"./dbpromise":4}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _idb = _interopRequireDefault(require("idb"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var dbPromise = {
  // creation and updating of database happens here.
  db: _idb.default.open("restaurant-reviews-db", 3, function (upgradeDb) {
    switch (upgradeDb.oldVersion) {
      case 0:
        upgradeDb.createObjectStore("restaurants", {
          keyPath: "id"
        });

      case 1:
        upgradeDb.createObjectStore("reviews", {
          keyPath: "id"
        }).createIndex("restaurant_id", "restaurant_id");

      case 2:
        upgradeDb.createObjectStore("offline", {
          autoIncrement: true,
          keyPath: "id"
        }).createIndex("restaurant_id", "restaurant_id");

      case 3:
        upgradeDb.createObjectStore("offline-fav", {
          autoIncrement: true,
          keyPath: "id"
        }).createIndex("restaurant_id", "restaurant_id");
    }
  }),

  /**
   * Save restaurant
   */
  putRestaurants: function putRestaurants(restaurants) {
    var forceUpdate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    if (!restaurants.push) restaurants = [restaurants];
    return this.db.then(function (db) {
      var store = db.transaction("restaurants", "readwrite").objectStore("restaurants");
      Promise.all(restaurants.map(function (apiRestaurant) {
        return store.get(apiRestaurant.id).then(function (idbRestaurant) {
          if (forceUpdate) return store.put(apiRestaurant);

          if (!idbRestaurant || new Date(apiRestaurant.updatedAt) > new Date(idbRestaurant.updatedAt)) {
            return store.put(apiRestaurant);
          }
        });
      })).then(function () {
        return store.complete;
      });
    });
  },
  putFavorite: function putFavorite(id, boolean) {
    return this.db.then(function (db) {
      var store = db.transaction("restaurants", "readwrite").objectStore("restaurants");
      store.get(id).then(function (idbRestaurant) {
        idbRestaurant.is_favorite = boolean.toString();
        store.put(idbRestaurant);
        return store.complete;
      });
    }).then(function () {
      console.info('Updated fav in idb');
    }).catch(function (err) {
      console.error('Error updating fav in idb', err);
    });
  },

  /**
   * Get restaurant
   */
  getRestaurants: function getRestaurants() {
    var id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
    return this.db.then(function (db) {
      var store = db.transaction("restaurants").objectStore("restaurants");
      if (id) return store.get(Number(id));
      return store.getAll();
    });
  },

  /**
   * Save reviews
   */
  putReviews: function putReviews(reviews) {
    if (!reviews.push) reviews = [reviews];
    return this.db.then(function (db) {
      var store = db.transaction("reviews", "readwrite").objectStore("reviews");
      Promise.all(reviews.map(function (apiReview) {
        return store.get(apiReview.id).then(function (idbReview) {
          if (!idbReview || new Date(apiReview.updatedAt) > new Date(idbReview.updatedAt)) {
            return store.put(apiReview);
          }
        });
      })).then(function () {
        return store.complete;
      });
    });
  },
  getReviewsForRestaurant: function getReviewsForRestaurant(id) {
    return this.db.then(function (db) {
      var storeIndex = db.transaction("reviews").objectStore("reviews").index("restaurant_id");
      return storeIndex.getAll(Number(id));
    });
  },
  // Storing offline reviews to offline idb collection
  putOfflineReview: function putOfflineReview(review) {
    return this.db.then(function (db) {
      var store = db.transaction("offline", "readwrite").objectStore("offline");
      store.put(review);
      return store.complete;
    }).then(function () {
      console.info('Saved a review to idb while offline'); // navigator.serviceWorker.ready.then(registration => {
      //   return registration.sync.register("flush");
      // });
    });
  },
  // Getting whatever I have in the offline idb collection
  getOfflineReviews: function getOfflineReviews() {
    return this.db.then(function (db) {
      var store = db.transaction("offline", "readonly").objectStore("offline");
      return store.getAll();
    }).then(function () {
      console.info('Retrieved offline reviews');
    });
  },
  // Clearing whatever I have in the offline idb collection
  clearOfflineReviews: function clearOfflineReviews() {
    return this.db.then(function (db) {
      var store = db.transaction("offline", "readwrite").objectStore("offline");
      store.clear();
      return store;
    }).then(function (res) {
      console.warning('Deleted offline reviews', res);
    });
  },
  // Storing offline favs to offline idb collection
  putOfflinefav: function putOfflinefav(fav) {
    return this.db.then(function (db) {
      var store = db.transaction("offline-fav", "readwrite").objectStore("offline-fav");
      store.put(fav);
      return store.complete;
    }).then(function () {
      console.info('Saved a fav to idb while offline'); // navigator.serviceWorker.ready.then(registration => {
      //   return registration.sync.register("flush");
      // });
    });
  },
  // Getting whatever I have in the offline idb collection
  getOfflinefavs: function getOfflinefavs() {
    return this.db.then(function (db) {
      var store = db.transaction("offline-fav", "readonly").objectStore("offline-fav");
      return store.getAll();
    }).then(function () {
      console.info('Retrieved offline favs');
    });
  },
  // Clearing whatever I have in the offline idb collection
  clearOfflinefavs: function clearOfflinefavs() {
    return this.db.then(function (db) {
      var store = db.transaction("offline-fav", "readwrite").objectStore("offline-fav");
      store.clear();
      return store;
    }).then(function (res) {
      console.warning('Deleted offline favs', res);
    });
  }
};
var _default = dbPromise;
exports.default = _default;

},{"idb":1}],5:[function(require,module,exports){
"use strict";

var _navigator = navigator,
    serviceWorker = _navigator.serviceWorker;

var registerServiceWorker = function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    serviceWorker.register("./sw.js", {
      scope: "./"
    }).then(function (registration) {
      console.info("Service worker registered", registration.scope);
      var sw = {};

      if (registration.installing) {
        sw.status = registration.installing;
        console.info("Service worker installing");
      }

      if (registration.waiting) {
        sw.status = registration.waiting;
        console.warn("Service worker waiting");
      }

      if (registration.active) {
        sw.status = registration.active;
        console.info("Service worker active");
      }

      if ('sync' in registration) {
        console.info("Sync active");
      }

      if (sw.status) {
        console.log("Service worker state:", sw.status.state);
        sw.status.addEventListener("statechange", function (e) {
          console.log("Service worker state:", e.target.state);
        });
      }

      return null;
    }).catch(function (err) {
      console.error("Service worker installation failed", err); // loadPage();
    });
  } // If you end up here serviceworker is not supported
  //loadPage();

};

document.addEventListener("DOMContentLoaded", function (event) {
  registerServiceWorker();
});

},{}],6:[function(require,module,exports){
"use strict";
'use-strict';

var _dbhelper = _interopRequireDefault(require("./dbhelper"));

require("./register");

require("./browser");

var _reviewform = _interopRequireDefault(require("./reviewform"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var restaurant = '';
var newMap;

var toggleClassDet = function toggleClassDet(e) {
  var staticMapEl = document.getElementById("map-img-detail");
  var mapEl = document.getElementById("detail-map");

  if (mapEl.className === "hidden") {
    mapEl.className = "";
    staticMapEl.className = "hidden";
    window.reload();
  } else {
    mapEl.className = "hidden"; // staticMapEl.src=getStaticMapUrl();

    staticMapEl.className = "";
    window.reload();
  }
};

var getStaticMapUrl = function getStaticMapUrl(mark) {
  var baseUrl = 'https://maps.googleapis.com/maps/api/staticmap?';
  var key = 'AIzaSyA4ISihvtXNswa92tcB_pu30DdB7lHn3c4';
  var format = 'jpg&';
  var staticMarkers = " markers=color:red|40.713829,-73.989667&\n                          markers=color:red|40.747143,-73.985414&\n                          markers=color:red|40.683555,-73.966393&\n                          markers=color:red|40.722216,-73.987501&\n                          markers=color:red|40.705089,-73.933585&\n                          markers=color:red|40.674925,-74.016162&\n                          markers=color:red|40.727397,-73.983645&\n                          markers=color:red|40.726584,-74.002082&\n                          markers=color:red|40.743797,-73.950652&\n                          markers=color:red|40.743394,-73.954235&";
  var width = 900 || window.innerWidth;
  var height = 400;
  var centerZoomSize = "center=40.722216,-73.987501&zoom=11&size=".concat(width, "x").concat(height, "&f&");
  var url = baseUrl + centerZoomSize + format + staticMarkers + key;
  return url;
};
/**
 * Initialize map if you look at the script imported google runs init
 */


window.initMap = function () {
  fetchRestaurantFromURL(function (error, restaurant) {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      newMap = new google.maps.Map(document.getElementById('detail-map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();

      _dbhelper.default.mapMarkerForRestaurant(self.restaurant, newMap);
    } // Google map makes a bunch of links that steal focus of a screen reader
    // Going to add an event that sets attribute to all of these items


    var mapEl = document.getElementById('detail-map');
    var staticMapEl = document.getElementById('map-img-detail'); // staticMapEl.src=getStaticMapUrl();

    var container = document.getElementById('detail-map-container');
    mapEl.addEventListener("keydown", function () {
      var mapLinks = mapEl.querySelectorAll('a');
      mapLinks.forEach(function (link) {
        return link.setAttribute('tabindex', '-1');
      });
    });
  });
};
/**
 * Get current restaurant from page URL.
 */


var fetchRestaurantFromURL = function fetchRestaurantFromURL(callback) {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }

  var id = getParameterByName('id');

  if (!id) {
    // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    _dbhelper.default.fetchRestaurantById(id, function (error, restaurant) {
      self.restaurant = restaurant;

      if (!restaurant) {
        console.error(error);
        return;
      }

      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};
/**
 * Create restaurant HTML and add it to the webpage
 */


var fillRestaurantHTML = function fillRestaurantHTML() {
  var restaurant = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant;
  var name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name; // const favButtonContainer = document.getElementById('fav-button-container');
  // favButtonContainer.appendChild(favoriteButton(restaurant));
  // favButtonContainer.alt = `Save ${restaurant.name} as a favorite`;

  var address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  var image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.classList.add = 'lozad';
  image.src = _dbhelper.default.imageUrlForRestaurant(restaurant);
  image.srcset = _dbhelper.default.imageSrcsetForRestaurant(restaurant);
  image.sizes = _dbhelper.default.imageSizesForRestaurant(restaurant);
  image.alt = "".concat(restaurant.name, " promotional image");
  var cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type; // fill operating hours

  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  } // fill reviews


  _dbhelper.default.fetchsReviewsByRestaurantId(restaurant.id).then(function (reviews) {
    return fillReviewsHTML(reviews);
  });
};
/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */


var fillRestaurantHoursHTML = function fillRestaurantHoursHTML() {
  var operatingHours = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant.operating_hours;
  var hours = document.getElementById('restaurant-hours');

  for (var key in operatingHours) {
    var row = document.createElement('tr');
    var day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);
    var time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);
    hours.setAttribute('tabindex', '0');
    hours.setAttribute('aria-label', "Hours of operation for ".concat(self.restaurant.name));
    hours.appendChild(row);
  }
};
/**
 * Create all reviews HTML and add them to the webpage.
 */


var fillReviewsHTML = function fillReviewsHTML() {
  var reviews = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant.reviews;
  var container = document.getElementById('reviews-container');
  var title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);
  var list = document.createElement('div');
  list.id = 'list-container';
  container.appendChild(list);
  var ul = document.createElement('ul');
  ul.id = 'reviews-list';
  ul.setAttribute('tabindex', '0');
  ul.setAttribute('aria-label', "List of restaurant reviews for ".concat(self.restaurant.name));
  list.appendChild(ul);

  if (!reviews) {
    var noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    noReviews.id = 'no-reviews';
    container.appendChild(noReviews);
  } else {
    reviews.forEach(function (review) {
      ul.appendChild(createReviewHTML(review));
    });
  }

  var head = document.createElement('h3');
  head.innerHTML = "Leave a Review";
  container.appendChild(head);
  var id = getParameterByName('id');
  container.appendChild((0, _reviewform.default)(id));
};
/**
 * Create review HTML and add it to the webpage.
 */


var createReviewHTML = function createReviewHTML(review) {
  var li = document.createElement('li');
  var name = document.createElement('p');
  name.innerHTML = review.name;
  name.className = 'reviewer';
  name.setAttribute('alt', 'Reviewer name');
  li.appendChild(name);
  var date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt).toLocaleDateString();
  date.className = 'date';
  date.setAttribute('alt', 'Date reviewed');
  li.appendChild(date);
  var rating = document.createElement('p');
  rating.innerHTML = "Rating: ".concat(review.rating);
  rating.className = 'rating';
  rating.setAttribute('alt', 'Rating given by reviewer');
  li.appendChild(rating);
  var comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.className = 'comments';
  comments.setAttribute('alt', 'Comments written by reviewer');
  li.appendChild(comments);
  return li;
};
/**
 * Add restaurant name to the breadcrumb navigation menu
 */


var fillBreadcrumb = function fillBreadcrumb() {
  var restaurant = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant;
  var breadcrumb = document.getElementById('breadcrumb');
  var li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};
/**
 * Get a parameter by name from page URL.
 */


var getParameterByName = function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp("[?&]".concat(name, "(=([^&#]*)|&|#|$)")),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

},{"./browser":2,"./dbhelper":3,"./register":5,"./reviewform":7}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = reviewForm;

var _dbhelper = _interopRequireDefault(require("./dbhelper"));

var _dbpromise = _interopRequireDefault(require("./dbpromise"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Returns a li element with review data so it can be appended to
 * the review list.
 */
function createReviewHTML(review) {
  var li = document.createElement("li");
  var reviewer = document.createElement("p");
  reviewer.innerHTML = reviewer.name;
  reviewer.className = 'reviewer';
  reviewer.setAttribute('alt', 'Reviewer name');
  li.appendChild(reviewer);
  var date = document.createElement("p");
  date.innerHTML = new Date(review.createdAt).toLocaleDateString();
  date.className = 'date';
  date.setAttribute('alt', 'Date reviewed');
  li.appendChild(date);
  var rating = document.createElement("p");
  rating.innerHTML = "Rating: ".concat(review.rating);
  rating.className = 'rating';
  rating.setAttribute('alt', 'Rating given by reviewer');
  li.appendChild(rating);
  var comments = document.createElement("p");
  comments.innerHTML = review.comments;
  comments.className = 'comments';
  comments.setAttribute('alt', 'Comments written by reviewer');
  li.appendChild(comments);
  return li;
}
/**
 * Clear form data
 */


function clearForm() {
  // clear form data
  document.getElementById("name").value = "";
  document.getElementById("rating").selectedIndex = 0;
  document.getElementById("comments").value = "";
}
/**
 * Remove no review element
 */


function removeNoReviews() {
  var noReviews = document.getElementById("no-reviews");
  if (noReviews) noReviews.remove();
}
/**
 * Make sure all form fields have a value and return data in
 * an object, so is ready for a POST request.
 */


function validateAndGetData() {
  var data = {}; // get name

  var name = document.getElementById("name");

  if (name.value === "") {
    name.focus();
    return;
  }

  data.name = name.value; // get rating

  var ratingSelect = document.getElementById("rating");
  var rating = ratingSelect.options[ratingSelect.selectedIndex].value;

  if (rating == "--") {
    ratingSelect.focus();
    return;
  }

  data.rating = Number(rating); // get comments

  var comments = document.getElementById("comments");

  if (comments.value === "") {
    comments.focus();
    return;
  }

  data.comments = comments.value; // get restaurant_id

  var restaurantId = document.getElementById("review-form").dataset.restaurantId;
  data.restaurant_id = Number(restaurantId);
  data.createdAt = new Date().toISOString();
  return data;
}
/**
 * Grab the review and send it to the dom, while you are at it clear the no reviews el, and clear form
 */


function insertReviewAndClear(review) {
  // post new review on page
  var reviewList = document.getElementById("reviews-list");
  var reviewEl = createReviewHTML(review);
  reviewList.appendChild(reviewEl); //remove noReviews element

  removeNoReviews(); // clear form

  clearForm();
}
/**
 * Handle submit.
 */


function handleSubmit(e) {
  e.preventDefault();
  var review = validateAndGetData();
  var url = "".concat(_dbhelper.default.API_URL, "/reviews/");
  var POST = {
    method: "POST",
    body: JSON.stringify(review)
  }; // If we are offline

  if (!navigator.onLine) {
    console.info('App was offline, when you tried to send review');

    _dbpromise.default.putOfflineReview(review, "review");

    insertReviewAndClear(review);
  } // If we are online


  return fetch(url, POST).then(function (response) {
    if (!response.ok) {
      return Promise.reject("We couldn't post review to server.");
    }

    return response.json();
  }).catch(function (err) {
    console.info('Disconnected when submitted form');
  }).then(function (apiReview) {
    insertReviewAndClear(apiReview);
  });
}
/**
 * Returns a form element for posting new reviews.
 */


function reviewForm(restaurantId) {
  var form = document.createElement("form");
  form.id = "review-form";
  form.dataset.restaurantId = restaurantId;
  var p = document.createElement("p");
  var name = document.createElement("input");
  name.id = "name";
  name.setAttribute("type", "text");
  name.setAttribute("aria-label", "Name");
  name.setAttribute("placeholder", "Name");
  p.appendChild(name);
  form.appendChild(p);
  p = document.createElement("p");
  var selectLabel = document.createElement("label");
  selectLabel.setAttribute("for", "rating");
  selectLabel.innerText = "Your rating: ";
  p.appendChild(selectLabel);
  var select = document.createElement("select");
  select.id = "rating";
  select.name = "rating";
  select.classList.add("rating");
  ["--", 1, 2, 3, 4, 5].forEach(function (number) {
    var option = document.createElement("option");
    option.value = number;
    option.innerHTML = number;
    if (number === "--") option.selected = true;
    select.appendChild(option);
  });
  p.appendChild(select);
  form.appendChild(p);
  p = document.createElement("p");
  var textarea = document.createElement("textarea");
  textarea.id = "comments";
  textarea.setAttribute("aria-label", "comments");
  textarea.setAttribute("placeholder", "Enter any comments here");
  textarea.setAttribute("rows", "10");
  p.appendChild(textarea);
  form.appendChild(p);
  p = document.createElement("p");
  var addButton = document.createElement("button");
  addButton.setAttribute("type", "submit");
  addButton.setAttribute("aria-label", "Add Review");
  addButton.classList.add("add-review");
  addButton.innerHTML = "<span>+</span>";
  p.appendChild(addButton);
  form.appendChild(p);
  form.onsubmit = handleSubmit;
  return form;
}

},{"./dbhelper":3,"./dbpromise":4}]},{},[6])

//# sourceMappingURL=restaurant_info.js.map
