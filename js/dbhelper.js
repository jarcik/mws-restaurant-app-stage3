//name of the database name
const dbName = 'restaurants';
//name of the store name with restaurants
const storeName = 'restaurants';

/**
 * Common database helper functions.
 */
class DBHelper {

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
}