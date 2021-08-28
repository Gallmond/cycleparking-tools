import fs from 'fs'
import readline from 'readline'
import geofire from 'geofire-common'
import {encode, decode, bounds, adjacent, neighbours} from './GeohashingVeness.js'

// add __dirname and __filename
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * handle the local data file that stores all the cycle park data
 */
class LocalStore{

  constructor(){
    /**
     * fully qualified path to the file containing the ndjson
     */
    this.ndjson_data_file = `${__dirname}/../files/cycleparks.ndjson`

    /**
     * place data will be stored here
     */
    this.data = null

    /**
     * geohash references will be kept here
     */
    this.geohash_reference = {}

  }


  /**
   * manually set the location of the data file
   * @param {string} ndjson_data_file 
   */
  setDataFile = ( ndjson_data_file ) => {
    this.ndjson_data_file
    return this
  }


  /**
   * //TODO is this even necessary?
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
   * search this.geohash_reference for keys in this range and return arrays under them
   * @param {string} start 
   * @param {string} end 
   * @returns {Promise} resolves with array of keys
   */
  getKeyFromGeohashReferenceInRange = (start, end) => {
    return new Promise((resolve, reject) => {
      this.getGeoHashReference().then(reference_data => {
        start = start.replace('~', '')
        end = end.replace('~', '')
        const start_4 = start.substr(0, 4)
        
        const found_keys = []
        for (const top_level_key in reference_data) {
          if (
            top_level_key.indexOf(start_4) === 0
          ) {
            for (const second_level_key in reference_data[top_level_key]) {
              if(
                second_level_key >= start
                && second_level_key <= end
              ){
                found_keys.push( ...reference_data[top_level_key][second_level_key] )
              }
            }
          }
        }

        resolve(found_keys)
      })
    })
  }


  /**
   * returns place keys in the reference object
   * NOTE: this will return all keys in the 'blocks' that this circle overlaps, not necessarily all within the circle 
   * @param {float} lat 
   * @param {float} lon 
   * @param {int} radius_in_metres 
   * @returns 
   */
  searchGeoHashReferencesInRange = (lat, lon, radius_in_metres) => {
    return new Promise((resolve, reject) => {
      // first get the geohash boxes this covers
      const bounds = geofire.geohashQueryBounds([lat, lon], radius_in_metres);
      const found_keys = []
      const promises = []
      for (let i = 0, l = bounds.length; i < l; i++) {
        const [start, end] = bounds[i];
        promises.push(this.getKeyFromGeohashReferenceInRange(start, end))
      }
      Promise.all(promises).then(array_of_arrays => {
        for (let i = 0, l = array_of_arrays.length; i < l; i++) {
          found_keys.push(...array_of_arrays[i])
        }
        resolve(found_keys)
      })
    })
  }

  /**
   * resolves with the record identified by the id or undefined
   * @param {string | undefined} id 
   * @returns {object} a place object
   */
  getPlaceByID = async ( id ) => {
    return new Promise((resolve,reject)=>{
      this.getPlaces().then( data => resolve(data[id]) );
    });
  }

  /**
   * lazy load this.data
   * @returns {object} this.data
   */
  getPlaces = () => {
    return new Promise((resolve,reject)=>{
      if(this.data === null){
        this.loadDataFromFile().then( data => resolve(data));
      }else{
        resolve(this.data) 
      }
    });
  }

  /**
   * the data must be initialised for the references to be build, so call it first
   * @returns {object} this.geohash_reference
   */
  getGeoHashReference = () => {
    return new Promise((resolve,reject)=>{
      this.getPlaces().then(()=>{
        resolve(this.geohash_reference)
      })
    })
  }

  /**
   * load the data from the ndjson file into this.data
   * @returns {object} this.data
   */
  loadDataFromFile = () => {
    return new Promise((resolve,reject)=>{
      const fileStream = fs.createReadStream( this.ndjson_data_file );
      const rl = readline.createInterface({input: fileStream});
      this.data = {}
      rl.on('line', (line_text) => {
        let ob = JSON.parse( line_text )
        let geohash = encode( ob.lat, ob.lon, 9 ) // 9 chars is accurate to about 4 metres ish (and is also as accurate as the TFL coords will get)
        this.addGeoHashReference( geohash, ob.id )
        ob['geohash'] = geohash
        this.data[ ob.id ] = ob
      });
      rl.on('close', () => {
        resolve(this.data)
      })
      rl.on('error', () => {
        reject('readline had an error reading the ndjson')
      })
    });
  }

}

export {LocalStore}