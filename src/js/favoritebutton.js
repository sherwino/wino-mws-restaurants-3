import DBHelper from "./dbhelper";
import dbPromise from "./dbpromise";

function handleClick(e) {
  e.preventDefault();

  const restaurantId = this.dataset.id;
  const fav = this.getAttribute('aria-pressed') == 'true';
  const url = `${DBHelper.API_URL}/restaurants/${restaurantId}/?is_favorite=${!fav}`;
  const PUT = { method: 'PUT' };

  // If we are offline
  if (!navigator.onLine) {
    console.info('App was offline, when you tried to send fav');
    dbPromise.putOfflinefav(!fav);
    this.setAttribute('aria-pressed', !fav);

  } else {
    // If we are online
    return fetch(url, PUT).then(response => {
      return response.json();
    }).then(updatedRestaurant => {
      // update restaurant on idb
      dbPromise.putRestaurants(updatedRestaurant, true);
      // change state of toggle button
      this.setAttribute('aria-pressed', !fav);
      return updatedRestaurant;
    }).catch((err) => {
      console.error('Couldnt update fav in API', err);
    });
  }

}



export default function favoriteButton(restaurant) {
  const button = document.createElement('button');
  button.innerHTML = "&#x2764;";
  button.className = "fav-restaurant";
  button.dataset.id = restaurant.id;
  button.setAttribute('aria-label', `Save ${restaurant.name} as a favorite`);
  button.setAttribute('aria-pressed', restaurant.is_favorite);
  button.onclick = handleClick;

  return button;
}
