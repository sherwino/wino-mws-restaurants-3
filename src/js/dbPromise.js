import idb from "idb";

const dbPromise = {
  // creation and updating of database happens here.
  db: idb.open("restaurant-reviews-db", 3, function(upgradeDb) {
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
            if (!idbRestaurant || new Date(apiRestaurant.updatedAt) > new Date(idbRestaurant.updatedAt)) {
              return store.put(apiRestaurant);
            }
          });
        })
      ).then(function() {
        return store.complete;
      });
    });
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
      ).then(function() {
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
  }
};

export default dbPromise;
