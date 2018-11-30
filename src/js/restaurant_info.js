'use-strict';

import DBHelper from './dbhelper';
import './register';
import './browser';
import reviewForm from './reviewform';


let restaurant = '';
var newMap;

/**
 * Initialize map if you look at the script imported google runs init
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      newMap = new google.maps.Map(document.getElementById('detail-map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, newMap);
    }
  // Google map makes a bunch of links that steal focus of a screen reader
  // Going to add an event that sets attribute to all of these items
  const mapEl = document.getElementById('detail-map');
  mapEl.addEventListener("keydown", () => {
  const mapLinks = mapEl.querySelectorAll('a');
  mapLinks.forEach(link => link.setAttribute('tabindex', '-1'));
});
  
  });
}

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  // const favButtonContainer = document.getElementById('fav-button-container');
  // favButtonContainer.appendChild(favoriteButton(restaurant));
  // favButtonContainer.alt = `Save ${restaurant.name} as a favorite`;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.classList.add = 'lazyload';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.srcset = DBHelper.imageSrcsetForRestaurant(restaurant);
  image.sizes = DBHelper.imageSizesForRestaurant(restaurant);
  image.alt = `${restaurant.name} promotional image`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  DBHelper.fetchsReviewsByRestaurantId(restaurant.id)
  .then((reviews) => fillReviewsHTML(reviews));
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);
    hours.setAttribute('tabindex', '0');
    hours.setAttribute('aria-label', `Hours of operation for ${self.restaurant.name}`)
    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  const list = document.createElement('div');
  list.id = 'list-container';
  container.appendChild(list);

  const ul = document.createElement('ul');
  ul.id = 'reviews-list';
  ul.setAttribute('tabindex', '0');
  ul.setAttribute('aria-label', `List of restaurant reviews for ${self.restaurant.name}`);
  list.appendChild(ul);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    noReviews.id = 'no-reviews';
    container.appendChild(noReviews);

  } else {
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));

    });
  }

  const head = document.createElement('h3');
  head.innerHTML = "Leave a Review";
  container.appendChild(head);
  const id = getParameterByName('id');
  container.appendChild(reviewForm(id));
}

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.className = 'reviewer';
  name.setAttribute('alt', 'Reviewer name');
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt).toLocaleDateString();
  date.className = 'date';
  date.setAttribute('alt', 'Date reviewed');
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = 'rating';
  rating.setAttribute('alt', 'Rating given by reviewer');
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.className = 'comments';
  comments.setAttribute('alt', 'Comments written by reviewer');
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
