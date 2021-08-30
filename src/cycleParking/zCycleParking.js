import { LocalStore } from "./LocalStore.js"

/**
 * This is the main class you want to use in the app
 */
class CycleParking{

  constructor(){
    this.localstore = new LocalStore()
  }

  /**
   * manually set the local store
   * @param {LocalStore} local_store_object 
   * @returns 
   */
  setLocalStore = ( local_store_object ) => {
    this.localstore = local_store_object
    return this
  } 

  /**
   * get the object of one place
   * @param {string} place_id 
   * @returns {object|undefined} the place json for one place (or undefined)
   */
  getCycleParkById = async ( place_id ) => {
    return await this.localstore.getPlaceByID( place_id )
  }

  /**
   * return a promise containing an array of place objects
   * @param {float} lat 
   * @param {float} lon 
   * @param {int} range_in_metres 
   * @returns 
   */
  getCycleParksNear = ( lat, lon, range_in_metres ) => {
    return new Promise((resolve,reject)=>{
      this.localstore.searchGeoHashReferencesInRange( lat, lon, range_in_metres ).then( place_keys => {
        const place_promises = []
        place_keys.forEach( key => {
          place_promises.push( this.localstore.getPlaceByID( key ) )
        })
        Promise.all( place_promises ).then( resolve )
      }).catch(err => {
        reject(err)
      })
    })
  }

  /**
   * return a array of place objects
   * @param {float} lat 
   * @param {float} lon 
   * @param {int} range_in_metres 
   * @returns 
   */
  getCycleParksNearSync = async ( lat, lon, range_in_metres ) => {
    return await this.getCycleParksNear( lat, lon, range_in_metres )
  }

}

export {CycleParking}