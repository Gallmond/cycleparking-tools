import * as os from 'os'
import * as fs from 'fs'
import { TFLAPI } from './src/cycleParking/TFLAPI.js'
import { DataFileManager } from './src/cycleParking/DataFileManager.js'

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
const dataFileManager = new DataFileManager()
const tfl_export_data = await dataFileManager.setTFLFile( tfl_export_file ).loadTFLFile()

dataFileManager.formatTFLData( tfl_export_data ).setDataFile( formatted_data_file ).saveDataFile().then( fs_result => {
  console.log(`wrote: ${formatted_data_file}`)
})

