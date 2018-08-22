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
//name of the database name
const dbName = 'restaurants';
//name of the store name with restaurants
const storeName = 'restaurants';
//name of the store name with reviews
const reviewsStoreName = 'reviews';

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * API URL
   */
  static get API_URL_BASE() {
    const port = 1337 // Change this to YOUR server port
    //url to server with data
    return `http://127.0.0.1:${port}/`;
  }

  /**
   * API URL
   */
  static get API_URL() {
    const port = 1337 // Change this to YOUR server port
    //url to server with restaurant data
    return `http://127.0.0.1:${port}/restaurants`;
  }

  /**
   * Promise for indexdb db.
   */
  static get dbPromise() {    
    //if there is no service worker available, just return
    if(!navigator.serviceWorker) return Promise.resolve();
    //opening db
    return idb.open(dbName, 1, (db) => {
      db.createObjectStore(storeName, {keyPath:'id'});
      var reviewsStore = db.createObjectStore(reviewsStoreName, {keyPath:'id', autoIncrement: true});
      reviewsStore.createIndex('restaurant_id', 'restaurant_id');
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper.dbPromise.then(db => {
      //there is no db, so first fetching of data
      if(!db) {
        //fetch data from server
        DBHelper.xhrForRestaurant(callback);
      } else {
        //db exists, just get data from there
        const tx = db.transaction(dbName);
        const store = tx.objectStore(storeName);
        store.getAll().then(restaurants => {
          if(!restaurants || restaurants.length === 0) {
            //no restaurants available?
            DBHelper.xhrForRestaurant(callback);
          } else {
            //we have restaurants, yay, send them through
            callback(null, restaurants)
          }
        });
      }
    });    
  }

  /**
   * Fetch data throught xmlhttprequest
   */
  static xhrForRestaurant(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', DBHelper.API_URL);
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const restaurantsFromJson = JSON.parse(xhr.responseText);
        //save restaurants to db
        DBHelper.storeRestaurantsDB(restaurantsFromJson);
        callback(null, restaurantsFromJson);
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }              
    };
    xhr.send();
  }

  /**
   * Store all fetched restaurants in indexDB.
   */
  static storeRestaurantsDB(restaurants) {
    DBHelper.dbPromise.then(db => {
      if(!db) return;
      const tx = db.transaction(dbName, "readwrite");
      const store = tx.objectStore(storeName);
      restaurants.forEach(restaurant => {
        store.put(restaurant);
      });
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
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
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
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
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
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
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if(!restaurant || restaurant.photograph === undefined) return null;
    return (`/img/${restaurant.photograph}.webp`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

  static imageAltText(restaurant) {
    return restaurant.name + ' restaurant in ' + restaurant.neighborhood + ' offers ' + restaurant.cuisine_type + ' cuisine type';
  }

  /**
   * Update the favorite status of the restaurant. Based on id of restaurant and tru/false value of favorite.
   */
  static updateFavStatus(id, isFav) {
    fetch(DBHelper.API_URL+'/'+id+'/'+'?is_favorite='+isFav,{method:'PUT'})
    .then(() => {
      DBHelper.dbPromise.then(db => {        
        const tx = db.transaction(dbName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.get(id).then(restaurant => {
          restaurant.is_favorite = isFav;
          store.put(restaurant);
        });
      })
    })
  }

  /**
   * Fetch reviews to the restaurant
   */
  static fetchReviewsRestaurantId(id) {
    // let xhr = new XMLHttpRequest();
    // xhr.open('GET', DBHelper.API_URL_BASE+'reviews/?restaurant_id='+id);
    // xhr.onload = () => {
    //   if (xhr.status === 200) { // Got a success response from server!
    //     const reviews = JSON.parse(xhr.responseText);
    //     return DBHelper.dbPromise.then(db => {
    //       const tx = db.transaction(reviewsStoreName, 'readwrite');
    //       const store = tx.objectStore(reviewsStoreName);
    //       if(Array.isArray(reviews)) {
    //         reviews.forEach((review) => {
    //           store.put(review);
    //         });
    //       } else {
    //         store.put(reviews);
    //       }
    //     });
    //     return Promise.resolve(reviews);
    //   } else { // Oops!. Got an error from server.
    //     const error = (`Request failed. Returned status of ${xhr.status}`);
    //     return DBHelper.dbPromise.then(db => {        
    //       const tx = db.transaction(reviewsStoreName, 'readwrite');
    //       const store = tx.objectStore(reviewsStoreName);
    //       const indexId = store.index(dbName);
    //       return indexId.getAll(id);
    //     }).then((storedREviews) => {
    //       return Promise.resolve(storedREviews);
    //     })
    //   }              
    // };
    // xhr.send();
    if(navigator.onLine) {
        return fetch(DBHelper.API_URL_BASE+'reviews/?restaurant_id='+id)
      .then((response) => {
        return response.json().then((data) => {
          return DBHelper.dbPromise.then(db => {
            const tx = db.transaction(reviewsStoreName, 'readwrite');
            const store = tx.objectStore(reviewsStoreName);
            if(Array.isArray(data)) {
              data.forEach((review) => {
                store.put(review);
              });
            } else {
              store.put(data);
            }
            return Promise.resolve(data);
          });
        });      
      }).catch((error) => {
        return DBHelper.dbPromise.then(db => {        
          const tx = db.transaction(reviewsStoreName, 'readwrite');
          const store = tx.objectStore(reviewsStoreName);
          const indexId = store.index('restaurant_id');
          return indexId.getAll(id);
        }).then((storedREviews) => {
          return Promise.resolve(storedREviews);
        })
      });
    } else {
      return DBHelper.dbPromise.then(db => {        
        const tx = db.transaction(reviewsStoreName, 'readwrite');
        const store = tx.objectStore(reviewsStoreName);
        const indexId = store.index('restaurant_id');
        return indexId.getAll(id);
      }).then((storedREviews) => {
        return Promise.resolve(storedREviews);
      })
    }    
  }

  /**
   * Reporting review to server and db
   */
  static addReviewToServer(review) {
    if(navigator.onLine) {
      DBHelper.onlineAddReview(review);
    } else {
      DBHelper.offlineAddReview(review);
    }
  }

  /**
   * Reporting review to idb
   */
  static addReviewToIDB(review) {
    //put to indexdb
    DBHelper.dbPromise.then(db => {
      const tx = db.transaction(reviewsStoreName, 'readwrite');
      const store = tx.objectStore(reviewsStoreName);
      store.put(review);      
    });
  }

  /**
   * Processing review, when the user is offline
   */
  static offlineAddReview(review) {
    const offline_review_key = 'offline_review';
    localStorage.setItem(offline_review_key, JSON.stringify(review));
    window.addEventListener('online', (event) => {
      let offline_review = JSON.parse(localStorage.getItem(offline_review_key));
      if(offline_review) {
        DBHelper.addReviewToServer(offline_review);
        localStorage.removeItem(offline_review_key);
        var offlineItems = document.getElementById('reviews-list').getElementsByClassName('offline');
        if(offlineItems) {
          for (var i = 0; i < offlineItems.length; i++) {
            offlineItems[i].classList.remove('offline');
          }
        }
      }
    });
  }
  
  /**
   * Processing review, when the user is offline
   */
  static onlineAddReview(review) {
    fetch(DBHelper.API_URL_BASE + 'reviews', 
    {
      method:'POST', 
      headers: new Headers({'Content-Type': 'application/json'}), 
      body: JSON.stringify(review)
    }).then((response) => {
      return response;
    }).catch((error) => {
      console.log('error in posting online review');
      console.log(error);
    });
  }

}