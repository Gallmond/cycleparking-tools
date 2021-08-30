import {encode, decode, bounds, adjacent, neighbours} from './GeohashingVeness.js'
import geofire from 'geofire-common'

class CycleParking{

  constructor( debug = false ){
    this.debug = debug

    /**
     * the actual place data object
     */
    this.data = {}

    /**
     * store of geohash keys keys
     */
    this.geohash_reference = {}

  }

  /**
   * set this.cyclepark_data
   * @param {object} cyclepark_data 
   * @returns 
   */
  setData = ( cyclepark_data ) => {
    this.data = cyclepark_data
    this.addGeohashesToData()
    return this
  }

  /**
   * get the object of one place
   * @param {string} place_id 
   * @returns {object|undefined} the place json for one place (or undefined)
   */
  getCycleParkById = ( place_id ) => this.data[ place_id ]


  /**
   * resolves with an array of places
   * @param {number} lat 
   * @param {number} lon 
   * @param {number} radius_in_metres 
   * @returns 
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
      const places = [] //TODO new format means place does not have key in itself!!!
      for(let i=0, l=all_keys.length; i<l; i++){
        let place_id = all_keys[i];
        let this_place = this.getCycleParkById( place_id )
        if(this_place) this_place['id'] = place_id
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
    for (const place_id in this.data) {
      // 9 chars is accurate to about 4 metres ish (and is also as accurate as the TFL coords will get)
      this.data[ 'geohash' ] = encode( this.data[ place_id ].lat, this.data[ place_id ].lon, 9 ) 
      this.addGeoHashReference( this.data[ 'geohash' ], place_id )
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


  


}

export { CycleParking }