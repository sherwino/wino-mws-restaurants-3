import DBHelper from "./dbhelper";
import dbPromise from "./dbpromise";

/**
 * Returns a li element with review data so it can be appended to 
 * the review list.
 */
function createReviewHTML(review) {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt).toLocaleDateString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Clear form data
 */
function clearForm() {
  // clear form data
  document.getElementById('name').value = "";
  document.getElementById('rating').selectedIndex = 0;
  document.getElementById('comments').value = "";
}

/**
 * Make sure all form fields have a value and return data in
 * an object, so is ready for a POST request.
 */
function validateAndGetData() {
  const data = {};

  // get name
  let name = document.getElementById('name');
  if (name.value === '') {
    name.focus();
    return;
  }
  data.name = name.value;

  // get rating
  const ratingSelect = document.getElementById('rating');
  const rating = ratingSelect.options[ratingSelect.selectedIndex].value;
  if (rating == "--") {
    ratingSelect.focus();
    return;
  }
  data.rating = Number(rating);

  // get comments
  let comments = document.getElementById('comments');
  if (comments.value === "") {
    comments.focus();
    return;
  }
  data.comments = comments.value;

  // get restaurant_id
  let restaurantId = document.getElementById('review-form').dataset.restaurantId;
  data.restaurant_id = Number(restaurantId);

  // set createdAT
  data.createdAt = new Date().toISOString();

  return data;
}

/**
 * Handle submit. 
 */
function handleSubmit(e) {
  e.preventDefault();
  const review = validateAndGetData();
  if (!review) return;

  console.log(review);

  const url = `${DBHelper.API_URL}/reviews/`;
  const POST = {
    method: 'POST',
    body: JSON.stringify(review)
  };

  // TODO: use Background Sync to sync data with API server
  return fetch(url, POST).then(response => {
    if (!response.ok) return Promise.reject("We couldn't post review to server.");
    return response.json();
  }).then(newNetworkReview => {
    // save new review on idb
    dbPromise.putReviews(newNetworkReview);
    // post new review on page
    const reviewList = document.getElementById('reviews-list');
    const review = createReviewHTML(newNetworkReview);
    reviewList.appendChild(review);
    // clear form
    clearForm();
  });

}

/**
 * Returns a form element for posting new reviews.
 */
export default function reviewForm(restaurantId) {
  const form = document.createElement('form');
  form.id = "review-form";
  form.dataset.restaurantId = restaurantId;

  let p = document.createElement('p');
  const name = document.createElement('input');
  name.id = "name"
  name.setAttribute('type', 'text');
  name.setAttribute('aria-label', 'Name');
  name.setAttribute('placeholder', 'Enter Your Name');
  p.appendChild(name);
  form.appendChild(p);

  p = document.createElement('p');
  const selectLabel = document.createElement('label');
  selectLabel.setAttribute('for', 'rating');
  selectLabel.innerText = "Your rating: ";
  p.appendChild(selectLabel);
  const select = document.createElement('select');
  select.id = "rating";
  select.name = "rating";
  select.classList.add('rating');
  ["--", 1,2,3,4,5].forEach(number => {
    const option = document.createElement('option');
    option.value = number;
    option.innerHTML = number;
    if (number === "--") option.selected = true;
    select.appendChild(option);
  });
  p.appendChild(select);
  form.appendChild(p);

  p = document.createElement('p');
  const textarea = document.createElement('textarea');
  textarea.id = "comments";
  textarea.setAttribute('aria-label', 'comments');
  textarea.setAttribute('placeholder', 'Enter any comments here');
  textarea.setAttribute('rows', '10');
  p.appendChild(textarea);
  form.appendChild(p);

  p = document.createElement('p');
  const addButton = document.createElement('button');
  addButton.setAttribute('type', 'submit');
  addButton.setAttribute('aria-label', 'Add Review');
  addButton.classList.add('add-review');
  addButton.innerHTML = "<span>+</span>";
  p.appendChild(addButton);
  form.appendChild(p);

  form.onsubmit = handleSubmit;

  return form;
};