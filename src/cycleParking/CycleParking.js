import * as fs from 'fs'
import {encode, decode, bounds, adjacent, neighbours} from './GeohashingVeness.js'
import geofire from 'geofire-common'

// allow __dirname in module
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

class CycleParking{

  constructor( debug = false ){
    this.debug = debug

    /**
     * file holding the data, use this if setData is not used
     */
    this.default_data_file = `${__dirname}/../files/cycleparking.json`

    /**
     * the actual place data object
     */
    this.data = {}
    this.geohashes_created = false

    /**
     * store of geohash keys keys
     */
    this.geohash_reference = {}

    // init with default data. The geohash references are not built until this is done
    this.getData()

  }

  /**
   * set this.cyclepark_data
   * @param {object} cyclepark_data 
   * @returns 
   */
  setData = ( cyclepark_data ) => {
    this.data = cyclepark_data
    if(!this.geohashes_created){
      this.addGeohashesToData()
      this.geohashes_created = true  
    }
    return this
  }


  // getter
  getData = () => {
    if(Object.keys(this.data).length === 0){
      const file_content = fs.readFileSync( this.default_data_file, {encoding:'utf-8'} )
      const file_object = JSON.parse( file_content )
      if(!file_object) throw new Error(`Could not read content of default_data_file ${this.default_data_file}`)
      this.setData( file_object )
    }
    return this.data
  }


  /**
   * get the object of one place
   * @param {string} place_id 
   * @returns {object|undefined} the place json for one place (or undefined)
   */
  getCycleParkById = ( place_id ) => {
    this.getData()[ place_id ]
  } 


  /**
   * resolves with an array of places
   * @param {number} lat 
   * @param {number} lon 
   * @param {number} radius_in_metres 
   * @returns {Promise} 
   */
  getCycleParksInRange = ( lat, lon, radius_in_metres ) => {
    return new Promise((resolve,reject)=>{
      
      const places = []

      // get bounds 
      const bounds = geofire.geohashQueryBounds([lat, lon], radius_in_metres);

      // get keys from the reference in this bound
      const all_keys = []
      for (let i = 0, l = bounds.length; i < l; i++) {
        const [start, end] = bounds[i];
        all_keys.push( ...this.getPlaceKeysInGeohashBounds( start, end ) ) 
      }

      // collect places
      for(let i=0, l=all_keys.length; i<l; i++){
        let place_id = all_keys[i];
        let this_place = this.getCycleParkById( place_id )

        // if for whatever reason this key does not return a place
        if(!this_place) continue

        // skip this place if it's not within radius_in_metres of the search point
        const dist_from_centre = this.getDistBetweenTwoPoints([lat, lon] , [this_place.lat, this_place.lon])
        if(dist_from_centre > radius_in_metres) continue

        // add the key as the id, it's not stored in the data object
        this_place['id'] = place_id
        this_place['dist'] = dist_from_centre.toFixed(1)

        // add it to the array
        places.push( this_place )
      }

      resolve(places) 
    })
  }


  /**
   * return array of keys that are found in the geohash_reference between given bounds
   * @param {string} start 
   * @param {string} end 
   * @returns 
   */
  getPlaceKeysInGeohashBounds = (start, end) => {
    start = start.replace('~', '')
    end = end.replace('~', '')
    const start_4 = start.substr(0, 4)
    
    const found_keys = []
    for (const top_level_key in this.geohash_reference) {
      if (
        top_level_key.indexOf(start_4) === 0
      ) {
        for (const second_level_key in this.geohash_reference[top_level_key]) {
          if(
            second_level_key >= start
            && second_level_key <= end
          ){
            found_keys.push( ...this.geohash_reference[top_level_key][second_level_key] )
          }
        }
      }
    }

    return found_keys
  }


  /**
   * set the 'geohash' property of all the objects in this.data
   * @returns {this}
   */
  addGeohashesToData = () => {
    for (const place_id in this.getData()) {
      // 9 chars is accurate to about 4 metres ish (and is also as accurate as the TFL coords will get)
      this.data[ place_id ][ 'geohash' ] = encode( this.data[ place_id ].lat, this.data[ place_id ].lon, 9 ) 
      this.addGeoHashReference( this.data[ place_id ][ 'geohash' ], place_id )
    }
    return this
  }


   /**
   * Add the given key to the geohash reference
   * @param {string} geohash
   * @param {string} key 
   */
  addGeoHashReference = ( geohash, key )=>{
    let geohash_4 = geohash.substr(0, 4)
    // create object for this level if we don't have it
    if( this.geohash_reference[ geohash_4 ] === undefined ) this.geohash_reference[ geohash_4 ] = {}

    // create array for full hash if we don't have it
    if( this.geohash_reference[ geohash_4 ][ geohash ] === undefined ) this.geohash_reference[ geohash_4 ][ geohash ] = []

    // add to this level if it's not already in there
    if( this.geohash_reference[ geohash_4 ][ geohash ].indexOf( key ) === -1 ){
      this.geohash_reference[ geohash_4 ][ geohash ].push( key ) 
    }
  }


  /**
   * get distance between two points on a sphere https://www.movable-type.co.uk/scripts/latlong.html
   * 
   * @param {array} latlon_1 [latitude , longitude]
   * @param {array} latlon_2 [latitude , longitude]
   * @returns {number} the distance in metres
   */
  getDistBetweenTwoPoints = (latlon_1, latlon_2) => {
    const [lat1, lon1] = latlon_1
    const [lat2, lon2] = latlon_2
    const R = 6371e3 // radius of the earth in metres (give or take)
    const lat1rads = lat1 * Math.PI/180 // ??, ?? in radians
    const lat2rads = lat2 * Math.PI/180
    const latdeltarads = (lat2-lat1) * Math.PI/180
    const londeltarads = (lon2-lon1) * Math.PI/180

    const a = Math.sin(latdeltarads/2) * Math.sin(latdeltarads/2) +
              Math.cos(lat1rads) * Math.cos(lat2rads) *
              Math.sin(londeltarads/2) * Math.sin(londeltarads/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // in metres
  }


}

export { CycleParking }