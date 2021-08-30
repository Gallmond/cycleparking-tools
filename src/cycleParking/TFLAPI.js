
import config from './../config.js'
import https from 'https'

class TFLAPI{

  constructor(debug = false)
  {
    this.debug = debug
    this.app_key = config.tfl_app_key
    this.api_domain = config.tfl_api_domain

    this.placeType = {
      "CYCLEPARK":"CyclePark", // this is the only one we use
      "AREAFORINTENSIFICATION":"AreaForIntensification",
      "BIKEPOINT":"BikePoint",
      "BOROUGHS":"Boroughs",
      "CABWISE":"Cabwise",
      "CARPARK":"CarPark",
      "CENSUSOUTPUTAREAS":"CensusOutputAreas",
      "CENSUSSUPEROUTPUTAREAS":"CensusSuperOutputAreas",
      "CENTRALACTIVITYZONE":"CentralActivityZone",
      "CHARGECONNECTOR":"ChargeConnector",
      "CHARGESTATION":"ChargeStation",
      "COACHBAY":"CoachBay",
      "COACHPARK":"CoachPark",
      "JAMCAM":"JamCam",
      "ONSTREETMETEREDBAY":"OnStreetMeteredBay",
      "OPPORTUNITYAREAS":"OpportunityAreas",
      "OTHERCOACHPARKING":"OtherCoachParking",
      "OYSTERTICKETSHOP":"OysterTicketShop",
      "REDLIGHTANDSPEEDCAM":"RedLightAndSpeedCam",
      "REDLIGHTCAM":"RedLightCam",
      "SPEEDCAM":"SpeedCam",
      "TAXIRANK":"TaxiRank",
      "VARIABLEMESSAGESIGN":"VariableMessageSign",
      "WARDS":"Wards",
      "WATERFREIGHTBRIDGE":"WaterfreightBridge",
      "WATERFREIGHTDOCK":"WaterfreightDock",
      "WATERFREIGHTJETTY":"WaterfreightJetty",
      "WATERFREIGHTLOCK":"WaterfreightLock",
      "WATERFREIGHTOTHER_ACCESS_POINT":"WaterfreightOther Access Point",
      "WATERFREIGHTTUNNEL":"WaterfreightTunnel",
      "WATERFREIGHTWHARF":"WaterfreightWharf"
    }
  }

  
  /**
   * Resolves with data, rejects with request object
   * @param {object} request_options 
   * @returns {Promise}
   */
  getRequest = ( request_options )  => {
    return new Promise((resolve,reject)=>{
      if(this.debug) console.log(`Making request with options:`, request_options)
      // make the request
      const req = https.request(request_options, res => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          if(this.debug) console.log('got data')
          data += chunk;
        });
        res.on('end', () => {
          if(this.debug) console.log(`request end statusCode: ${res.statusCode} ${res.statusMessage}`)
          if(res.statusCode < 200 && res.statusCode > 299){
            reject(req)
          }
          resolve(data);
        });
      })
      req.on('error', () => {
        if(this.debug) console.log(`request error statusCode: ${res.statusCode} ${res.statusMessage}`)
        reject(req)
      })
      req.on('timeout', () => {
        if(this.debug) console.log(`request timeout statusCode: ${res.statusCode} ${res.statusMessage}`)
        reject(req)
      })
      req.end() // send it
    })
  }


  /**
   * request all places of a given typ
   * @param {string} place_type 
   * @returns 
   */
  requestPlaces = ( place_type ) => {
    return new Promise((resolve,reject)=>{

      const endpoint = `/Place/Type/${place_type}`

      // request options
      const options = {
        hostname: this.api_domain,
        path: endpoint + this.buildQueryString({ app_key: this.app_key }),
        port: 443,
        method: 'GET',
        timeout: 120000
      }

      this.getRequest( options ).then(resolve).catch(reject)

    })
  }

  
  /**
   * get all cycle park places from TFL
   * @returns {Promise} resolves with string of all place data
   */
  requestCycleParkPlaces = () => {
    return new Promise((resolve,reject)=>{
      this.requestPlaces( this.placeType['CYCLEPARK'] ).then(resolve).catch(reject)
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

export { TFLAPI }