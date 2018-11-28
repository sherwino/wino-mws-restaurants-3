import dbPromise from "./dbpromise";

/**
 * Common database helper functions.
 */
export default class DBHelper {
  /**
   * API URL
   */
  static get API_URL() {
    const port = 1337; // port where sails server will listen.

    const heroku = 'https://winosails.herokuapp.com';
    const isLocalHost = () => {
      if (window.location.hostname.includes("localhost")) {
        return `http://localhost:${port}`;
      }
    };

    const url = isLocalHost() || heroku;

    return url;
  }


  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", `${DBHelper.API_URL}/restaurants`);
    xhr.onload = () => {
      if (xhr.status === 200) {
        const restaurants = JSON.parse(xhr.responseText);
        dbPromise.putRestaurants(restaurants);
        callback(null, restaurants);
      } else {
        // Oops!. Got an error from server.
        console.log(
          `Request failed. Returned status of ${xhr.status}, trying idb...`
        );
        // if xhr request isn't code 200, try idb
        dbPromise.getRestaurants().then(idbRestaurants => {
          if (idbRestaurants.length) {
            callback(null, idbRestaurants);
          } else {
            callback("No restaurants found in idb", null);
          }
        });
      }
    };
    // XHR needs error handling for when server is down (doesn't respond or sends back codes)
    xhr.onerror = () => {
      console.log("Error while trying XHR, trying idb...");
      // try idb, and if we get restaurants back, return them, otherwise return an error
      dbPromise.getRestaurants().then(idbRestaurants => {
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
  static fetchRestaurantById(id, callback) {
    fetch(`${DBHelper.API_URL}/restaurants/${id}`)
      .then(response => {
        if (!response.ok)
          return Promise.reject("Restaurant couldn't be fetched from network");
        return response.json();
      })
      .then(fetchedRestaurant => {
        // if restaurant could be fetched from network:
        dbPromise.putRestaurants(fetchedRestaurant);
        return callback(null, fetchedRestaurant);
      })
      .catch(networkError => {
        // if restaurant couldn't be fetched from network:
        console.log(`${networkError}, trying idb.`);
        dbPromise.getRestaurants(id).then(idbRestaurant => {
          if (!idbRestaurant)
            return callback("Restaurant not found in idb either", null);
          return callback(null, idbRestaurant);
        });
      });
  }

  /**
   * Fetch restaurant reviews by restaurant id.
   */
  static fetchsReviewsByRestaurantId(id) {
    return fetch(`${DBHelper.API_URL}/reviews/?restaurant_id=${id}`)
      .then(response => {
        if (!response.ok)
          return Promise.reject("Reviews couldn't be fetched from network");
        return response.json();
      })
      .then(fetchedReviews => {
        dbPromise.putReviews(fetchedReviews);
        return fetchedReviews;
      })
      .catch(networkError => {
        console.log(`${networkError}`);
        return dbPromise.getReviewsForRestaurant(id)
        .then(idbReviews => {
          if(!idbReviews.length) return null;
          return idbReviewsl
        });
      });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != "all") {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
      const url = `./img/${restaurant.photograph || restaurant.id}-medium.jpg`;
  
    return url;
  }

  /**
   * Restaurant srcset attribute for browser to decide best resolution. It uses restaurant.photograph
   * and fallbacks to restaurant.id if former is missing.
   */
  static imageSrcsetForRestaurant(restaurant) {
    const imageSrc = `./img/${restaurant.photograph || restaurant.id}`;
    return `${imageSrc}-small.jpg 300w,
            ${imageSrc}-medium.jpg 600w,
            ${imageSrc}-large.jpg 800w`;
  }

  /**
   * Restaurant sizes attribute so browser knows image sizes before deciding
   * what image to download.
   */
  static imageSizesForRestaurant(restaurant) {
    return `(max-width: 360px) 280px,
            (max-width: 600px) 600px,
            400px`;
  }

  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }
}
