import idb from "idb";

const dbPromise = {
  // creation and updating of database happens here.
  db: idb.open("restaurant-reviews-db", 3, function (upgradeDb) {
    switch (upgradeDb.oldVersion) {
      case 0:
        upgradeDb.createObjectStore("restaurants", { keyPath: "id" });
      case 1:
        upgradeDb
          .createObjectStore("reviews", { keyPath: "id" })
          .createIndex("restaurant_id", "restaurant_id");
      case 2:
        upgradeDb
          .createObjectStore("offline", { autoIncrement: true, keyPath: "id" })
          .createIndex("restaurant_id", "restaurant_id");
      case 3:
        upgradeDb
          .createObjectStore("offline-fav", { autoIncrement: true, keyPath: "id" })
          .createIndex("restaurant_id", "restaurant_id");
    }
  }),

  /**
   * Save restaurant
   */
  putRestaurants(restaurants, forceUpdate = false) {
    if (!restaurants.push) restaurants = [restaurants];
    return this.db.then(db => {
      const store = db
        .transaction("restaurants", "readwrite")
        .objectStore("restaurants");
      Promise.all(
        restaurants.map(apiRestaurant => {
          return store.get(apiRestaurant.id).then(idbRestaurant => {
            if (forceUpdate) return store.put(apiRestaurant);
            if (
              !idbRestaurant ||
              new Date(apiRestaurant.updatedAt) >
              new Date(idbRestaurant.updatedAt)
            ) {
              return store.put(apiRestaurant);
            }
          });
        })
      ).then(function () {
        return store.complete;
      });
    });
  },

  putFavorite(id, boolean) {
    return this.db
      .then((db) => {
        const store = db
          .transaction("restaurants", "readwrite")
          .objectStore("restaurants");

        store.get(id)
          .then((idbRestaurant) => {
            idbRestaurant.is_favorite = boolean.toString();

            store.put(idbRestaurant);

            return store.complete;
          })
      }).then(() => {
        console.info('Updated fav in idb');
      }).catch((err) => {
        console.error('Error updating fav in idb', err);
      })
  },

  /**
   * Get restaurant
   */
  getRestaurants(id = undefined) {
    return this.db.then(db => {
      const store = db.transaction("restaurants").objectStore("restaurants");
      if (id) return store.get(Number(id));
      return store.getAll();
    });
  },

  /**
   * Save reviews
   */
  putReviews(reviews) {
    if (!reviews.push) reviews = [reviews];
    return this.db.then(db => {
      const store = db
        .transaction("reviews", "readwrite")
        .objectStore("reviews");
      Promise.all(
        reviews.map(apiReview => {
          return store.get(apiReview.id).then(idbReview => {
            if (
              !idbReview ||
              new Date(apiReview.updatedAt) > new Date(idbReview.updatedAt)
            ) {
              return store.put(apiReview);
            }
          });
        })
      ).then(function () {
        return store.complete;
      });
    });
  },

  getReviewsForRestaurant(id) {
    return this.db.then(db => {
      const storeIndex = db
        .transaction("reviews")
        .objectStore("reviews")
        .index("restaurant_id");
      return storeIndex.getAll(Number(id));
    });
  },

  // Storing offline reviews to offline idb collection
  putOfflineReview(review) {
    return this.db
      .then(db => {
        const store = db.transaction("offline", "readwrite").objectStore("offline");
        store.put(review);

        return store.complete;
      })
      .then(() => {
        console.info('Saved a review to idb while offline');
        // navigator.serviceWorker.ready.then(registration => {
        //   return registration.sync.register("flush");
        // });
      });
  },

  // Getting whatever I have in the offline idb collection
  getOfflineReviews() {
    return this.db
      .then(db => {
        const store = db.transaction("offline", "readonly").objectStore("offline");

        return store.getAll();
      })
      .then(() => {
        console.info('Retrieved offline reviews');
      });
  },

  // Clearing whatever I have in the offline idb collection
  clearOfflineReviews() {
    return this.db
      .then(db => {
        const store = db.transaction("offline", "readwrite").objectStore("offline");
        store.clear();

        return store;
      })
      .then((res) => {
        console.warning('Deleted offline reviews', res);
      });
  },

  // Storing offline favs to offline idb collection
  putOfflinefav(fav) {
    return this.db
      .then(db => {
        const store = db.transaction("offline-fav", "readwrite").objectStore("offline-fav");
        store.put(fav);

        return store.complete;
      })
      .then(() => {
        console.info('Saved a fav to idb while offline');
        // navigator.serviceWorker.ready.then(registration => {
        //   return registration.sync.register("flush");
        // });
      });
  },

  // Getting whatever I have in the offline idb collection
  getOfflinefavs() {
    return this.db
      .then(db => {
        const store = db.transaction("offline-fav", "readonly").objectStore("offline-fav");

        return store.getAll();
      })
      .then(() => {
        console.info('Retrieved offline favs');
      });
  },

  // Clearing whatever I have in the offline idb collection
  clearOfflinefavs() {
    return this.db
      .then(db => {
        const store = db.transaction("offline-fav", "readwrite").objectStore("offline-fav");
        store.clear();

        return store;
      })
      .then((res) => {
        console.warning('Deleted offline favs', res);
      });
  },

};

export default dbPromise;
