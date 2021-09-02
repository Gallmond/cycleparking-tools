import * as fs from 'fs'

/**
 * create the cycleparks.ndjson
 */
class DataFileManager{

  constructor(){
    this.tfl_json_file = false
    this.data_file = false
    this.data_json = {}

    /**
     * key => value object
     * key is the property name from the raw TFL data
     * value is the new name it should have on our small data
     * any additionalProperty keys should be included here
     */
    this.place_property_map = {
      'id': 'id',
      'commonName': 'name',
      'placeType': 'type',
      'lat': 'lat',
      'lon': 'lon',
      // additional properties
      'CycleStandType': 'standtype',
      'NumberOfCycleParkingSpaces': 'spaces',
      'Secure': 'secure',
      'Photo1Url': 'picurl1',
    }


  }

  // getters
  getData = () => {
    this.data_json
  }
  getDataFile = () => {
    this.data_file
  }


  /**
   * set this.data_file
   * @param {string} file_path 
   * @returns 
   */
  setDataFile = ( file_path ) => {
    this.data_file = file_path
    return this
  }


  /**
   * set this.tfl_json_file
   * @param {string} file_path 
   * @returns 
   */
  setTFLFile = ( file_path ) => {
    this.tfl_json_file = file_path
    return this
  }


  /**
   * read the TFL data from a file
   * @returns {string} entire file
   */
  loadTFLFile = () => {
    return new Promise((resolve,reject)=>{
      fs.readFile( this.tfl_json_file, {encoding:'utf-8'}, (err, data) => {
        if(err) reject(err)
        resolve(data)
      })
    })
  }


  /**
   * format the raw TFL place data into our format
   * sets this.data_json
   * @param {string} tfl_export_data 
   * @returns {this}
   */
  formatTFLData = ( tfl_export_data ) => {
    const parsed_json = JSON.parse( tfl_export_data )
    if(!parsed_json) throw new Error('Could not parse tfl_export_data')
    this.data_json = {}
    for (let i = 0, l = parsed_json.length; i < l; i++) {
      const this_place = this.formatPlaceJSON( parsed_json[i] )
      const this_place_id = this_place['id']
      delete this_place['id'] // remove the id, we're using it as the object's key anyway
      this.data_json[ this_place_id ] = this_place
    }
    return this
  }


  /**
   * Save the current json_lines to this.data_file
   * @returns {Promise} resolved with the file name
   */
  saveDataFile = ( ) => {
    return new Promise((resolve,reject)=>{
      fs.writeFile( this.data_file, JSON.stringify(this.data_json), (err) =>{ 
        if(err) reject(err)
        resolve( this.data_file )
      })
    })
  }


  /**
   * reformat a place object from the raw TFL format to our flavour
   * @param {object} single_place_object 
   */
  formatPlaceJSON = ( single_place_object ) => {
    const new_object = {}
    // get the additional properties for this place
    let additional_properties = this.getAdditionalPropertiesFromPlaceJSON( single_place_object ) 

    // for each property that we want to keep
    for (const place_property in this.place_property_map) {
      // get the new name we'll give it
      const new_property_name = this.place_property_map[ place_property ]

      // if the main object has any of these properties
      if( single_place_object[ place_property ] !== undefined ){
        new_object[ new_property_name ] = single_place_object[ place_property ]
      }

      // if any of the additionalProperties use this property
      if( additional_properties[ place_property ] !== undefined ){
        new_object[ new_property_name ] = additional_properties[ place_property ]
      }

    }

    return new_object
  }


  /**
   * turn the raw additional_properties of a place_json to a key => value object
   * @param {object} place_json 
   * @returns {object}
   */
   getAdditionalPropertiesFromPlaceJSON = ( place_json ) => {
    let additional_properties = {}

    if(!Array.isArray(place_json['additionalProperties'])) return additional_properties;

    for (let i = 0, l = place_json['additionalProperties'].length; i < l; i++) {
      let this_property  = place_json['additionalProperties'][i]
      additional_properties[ this_property['key'] ] = this_property['value'];
    }

    return additional_properties;
  }


}

export { DataFileManager }