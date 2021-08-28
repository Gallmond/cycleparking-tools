const https = require('https')
const fs = require('fs')
const config = require('./../config')

class ExportManager{

  constructor(){
    this.debug = false
    this.tfl_api_domain = config.tfl_api_domain
    this.tfl_app_key = config.tfl_app_key
  }

  /**
   * 
   * @param {bool} debug 
   */
  setDebug = (debug)=>{
    this.debug = debug
    return this
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
  
  /**
   * define here what the slimmed down cyclepark json should include
   * @param {object} place_json 
   * @returns {object}
   */
  reducePlaceJSONToSmallJson = ( place_json ) => {
    const all_additional_properties = this.getAdditionalPropertiesFromPlaceJSON( place_json );

    const reduced_json = {
      id: place_json.id,
      name: place_json.commonName,
      type: place_json.placeType,
      lat: place_json.lat,
      lon: place_json.lon,

      // additional properties
      standtype: all_additional_properties[ "CycleStandType" ],
      spaces: all_additional_properties[ "NumberOfCycleParkingSpaces" ],
      secure: all_additional_properties[ "Secure" ],
      picurl1: all_additional_properties[ "Photo1Url" ],
    }

    return reduced_json
  }


  /**
   * take the filepath of a raw tfl export and reduce it to a smaller ndjson
   * @param {string} place_export_path 
   * @returns {Promise} resolves with the output file path
   */
  reducePlaceFileSize = ( place_export_path, output_file_path ) => {
    return new Promise((resolve,reject)=>{

      // load raw text file
      const tfl_export_text = fs.readFileSync( place_export_path, { encoding: 'utf-8'} )

      // parse the json
      const tfl_export_json = JSON.parse( tfl_export_text )

      // create a file to write to
      const output_file_writer = fs.createWriteStream( output_file_path, {flags: "w"} ); // "w" will create a file, or truncate an existing file for writing
      
      // add lines of json to the file
      for (let i = 0, l = tfl_export_json.length; i < l; i++) {
        
        // for each object get the minimum information we want
        let place_json = tfl_export_json[i]
        let small_json = this.reducePlaceJSONToSmallJson( place_json )

        // write each object to an ndjson file at output_file_path
        output_file_writer.write(JSON.stringify(small_json) + "\n")
      }

      return resolve(output_file_path)

    })
  }


  /**
   * save all the data to a given file
   * @param {string} destination_file 
   * @returns {Promise} resolves with the destination file path
   */
  saveAllCycleParkPlacesFromTFLToFile = ( destination_file ) => {
    return new Promise((resolve,reject) => {
      // get the data
      this.requestAllCycleParkPlacesFromTFL().then( place_data => {
        // save as file
        fs.writeFile( destination_file, place_data, (err, result) => {
          if(err) reject(err)
          resolve(destination_file)
        })
      })
    })
  }

  /**
   * return a promise containing a very large text string
   */
  requestAllCycleParkPlacesFromTFL = () => {
    return new Promise((resolve, reject) => {
      //https://api.tfl.gov.uk/Place/Type/CyclePark

      const endpoint = '/Place/Type/CyclePark'

      // request options
      const options = {
        hostname: this.tfl_api_domain,
        path: endpoint + this.buildQueryString({ app_key: this.tfl_app_key }),
        port: 443,
        method: 'GET',
        timeout: 120000
      }

      if(this.debug){
        console.log('Making request', options)
      }

      // make the request
      const req = https.request(options, res => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          if(this.debug) console.log('got data')
          data += chunk;
        });
        res.on('end', () => {
          if(this.debug) console.log('request ended with status', res.statusCode, res.statusMessage)
          if(res.statusCode < 200 && res.statusCode > 299){
            console.log(res)
            throw new Error('There was an error requesting data from TFL')
          }
          resolve(data);
        });
      })
      req.on('error', () => {
        if(this.debug) console.log('request error')
        reject(req)
      })
      req.on('timeout', () => {
        if(this.debug) console.log('request timeout')
        reject(req)
      })
      req.end(); // send it

    })
  }

  /**
   * return a querystring from an object of key => val pairs
   * @param {object} params_object like {foo:"bar", fizz: "buzz"}
   * @returns {string} like ?foo=bar&fizz=buzz
   */
   buildQueryString = (params_object) => {
    const qs_arr = []
    for (let param_name in params_object) {
      qs_arr.push(`${param_name}=${encodeURIComponent(params_object[param_name])}`)
    }
    return `?${qs_arr.join('&')}`
  }

}

module.exports = ExportManager