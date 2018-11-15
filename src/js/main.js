'use-strict';

import DBHelper from './dbhelper';
import './register';
import './browser';
import './favoritebutton';
import favoriteButton from './favoriteButton';


let restaurants,
  neighborhoods,
  cuisines
var newMap
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    // Aria role needs to be dynamically added too
    option.setAttribute('role', 'option'); 
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
        // Aria role needs to be dynamically added too
        option.setAttribute('role', 'option'); 
    select.append(option);
  });
}

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  newMap = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();

// Google map makes a bunch of links that steal focus of a screen reader
// Going to add an event that sets attribute to all of these items
const mapEl = document.getElementById('map');
mapEl.addEventListener("keydown", () => {
  const mapLinks = mapEl.querySelectorAll('a');
  mapLinks.forEach(link => link.setAttribute('tabindex', '-1'));
});
  
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (markers) {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
  }
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.srcset = DBHelper.imageSrcsetForRestaurant(restaurant);
  image.sizes = DBHelper.imageSizesForRestaurant(restaurant);
  image.alt = `${restaurant.name}, promotional image.`;
  li.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const fav = favoriteButton(restaurant);
  fav.alt = `Save ${restaurant.name} as a favorite`;
  fav.className = 'fav-restaurant';
  li.append(fav);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  const addressArray = restaurant.address.split(',')
  const cityStateZip = document.createElement('p');
  const more = document.createElement('a');
  const url = DBHelper.urlForRestaurant(restaurant);
  
  address.innerHTML = addressArray[0];
  cityStateZip.innerHTML = `${addressArray[1]}, ${addressArray[2]}`;

  li.append(address);
  li.append(cityStateZip);

  more.className = 'view-details-btn';
  more.innerHTML = 'View Details';
  more.type = 'Button'
  more.setAttribute('role', 'button');
  more.setAttribute('aria-label', `View more details about ${restaurant.name}`)
  more.href = url;
  li.addEventListener('click', (event) => {
    window.location = url;
  });

  li.setAttribute('aria-label', 
  `${restaurant.name} is an ${restaurant.cuisine_type} restaurant in ${restaurant.neighborhood}`
  )
  li.setAttribute('tabindex', '0');
  
  li.append(more)

  return li
}

const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, newMap);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    markers.push(marker);
  });
}

