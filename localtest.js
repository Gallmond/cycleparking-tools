import * as os from 'os'
import * as fs from 'fs'
import { TFLAPI } from './src/cycleParking/TFLAPI.js'
import { DataFileManager } from './src/cycleParking/DataFileManager.js'
import { CycleParking } from './src/cycleParking/CycleParking.js'

const handleReject = (err) => {
  console.error('Something rejected')
  console.error(err)
}

const tfl_export_file = `${os.tmpdir()}/tfl_export.json`
const formatted_data_file = `${os.tmpdir()}/formatted.json`

console.log(`tfl_export_file: ${tfl_export_file}`)
console.log(`formatted_data_file: ${formatted_data_file}`)

/**
 * request and save TFL export to file
 */
// const api = new TFLAPI( true )
// api.requestCycleParkPlaces().then( data_string => {
//   console.log(`resolved with data of length ${data_string.length}`)
//   // save it
//   fs.writeFile( tfl_export_file, data_string, (err, result)=>{
//     if(err) throw err
//     console.log(`wrote ${tfl_export_file}`)
//   })
// }).catch( handleReject )

/**
 * load and format data
 */
// const dataFileManager = new DataFileManager()
// // load from TFL export
// const tfl_export_data = await dataFileManager.setTFLFile( tfl_export_file ).loadTFLFile()
// // format and save to file
// const written_file = await dataFileManager.formatTFLData( tfl_export_data ).setDataFile( formatted_data_file ).saveDataFile()
// console.log(`written_file: ${written_file}`)

/**
 * give formatted data to CycleParking
 * search it!
 */
const lat = 51.470628, lon = -0.255812, radius_in_metres = 50 // the roundabout near me

const cycleParking = new CycleParking()
// load data from local file for testing sake...
const file_data = fs.readFileSync( formatted_data_file, {encoding:'utf-8'} )
const data_object = JSON.parse( file_data )
cycleParking.setData( data_object )

cycleParking.getCycleParksInRange( lat, lon, radius_in_metres ).then( places  => {
  console.log(`got ${places.length} places:`, places)
}).catch( handleReject )