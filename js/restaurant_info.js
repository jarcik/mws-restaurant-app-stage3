let restaurant;
var map;
let id;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      fillBreadcrumb();
    }
  });
});

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
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
      self.id = id;
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
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = DBHelper.imageAltText(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;
  //fill reviews
  fillRestaurantReviews(restaurant.id);
  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = () => {
  DBHelper.fetchReviewsRestaurantId(self.restaurant.id)
  .then((reviews) => {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h3');
    title.innerHTML = 'Reviews';
    container.appendChild(title);
  
    if (!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      noReviews.id = 'noReviews';
      container.appendChild(noReviews);
      return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review, false));
    });
    container.appendChild(ul);
  })
  .catch((error) => {
    console.log('error in fetching reviews');
  });
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review, newReview) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const dateElement = document.createElement('p');
  var date = new Date(review.updatedAt);
  dateElement.innerHTML = `${date.getDay()}.${date.getMonth()+1}.${date.getFullYear()}`;
  li.appendChild(dateElement);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  //jedna se o nove review a uzivatel je offline, musi se zvyraznit, ze je offline review
  if(newReview && !navigator.onLine) {
    li.classList.add('offline');
  }

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
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

 /**
  * Fetch and Fill restaurant reviews from server
  */
 fillRestaurantReviews = (id) => {
  
 }

/**
 * ADd review to the restaurant by the visitor
 */
 addReview = () => {
  let id = self.id;
  let author = document.getElementById('reviewAuthor');
  let comment = document.getElementById('comment');
  let rating = 0;
  for(let i = 1; i <= 5; i++) {
    let rationRadio = document.getElementById('star'+i);
    if(rationRadio && rationRadio.checked) {
      rating = i;
    }
  }
  let errors = document.getElementById('errors');
  let returnErrors = false;
  if(!author || !author.value) {
    const li = document.createElement('li');
    li.innerHTML = 'Fill your name';
    errors.appendChild(li);
    returnErrors = true;
  }  
  if(!comment || !comment.value) {
    const li = document.createElement('li');
    li.innerHTML = 'Fill your comment';
    errors.appendChild(li);
    returnErrors = true;
  }
  if(!rating) {
    const li = document.createElement('li');
    li.innerHTML = 'Fill your rating';
    errors.appendChild(li);
    returnErrors = true;
  }
  if(returnErrors) {
    let errorH = document.createElement('h4');
    errorH.innerHTML = 'Errors in the form:';
    errorH.id = 'errorHead';
    let errorSection = document.getElementById('errorSection');
    errorSection.appendChild(errorH);
    return;
  }
  let errorHead = document.getElementById('errorHead');
  if(errorHead) {
    errorHead.parentNode.removeChild(errorHead);
  }
  let review = {restaurant_id: parseInt(id), name: author.value, comments: comment.value, rating: rating, };
  console.log(review);

  DBHelper.addReviewToServer(review);
  DBHelper.addReviewToIDB(review);  
  addReviewToHtml(review);

  document.getElementById('add-review-form').reset();
}

/**
 * adding review wchich was proceed for errors and to backend
 */
addReviewToHtml = (review) => {
  if(!review) return;  
  let noREviews = document.getElementById('noReviews');
  if (noREviews) {
    noREviews.parentNode.removeChild(noREviews);
  }
  review.createdAt = new Date().getTime();
  review.updatedAt = new Date().getTime();
  let reviewList = document.getElementById('reviews-list');
  reviewList.appendChild(createReviewHTML(review, true));
}