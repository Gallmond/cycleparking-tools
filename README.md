To include this tool in a local project
```
# just clone it to a local directory
git clone https://github.com/Gallmond/cycleparking-tools.git ~/modules/cycleparking-tools

# and in your project, npm install from that directory
cd ~/projects/your-cool-project
npm install ~/modules/cycleparking-tools
```

Then in your code 

```javascript
import { CycleParking } from 'cycleparking-tools'

const cp = new CycleParking()

const lat = 51.470526, lon = -0.255860, radius_in_metres = 100

cp.getCycleParksInRange( lat, lon, radius_in_metres ).then( places => {
  console.log(`getCycleParksInRange got ${places.length} places, eg:`)
  console.log( places[0] )
}).catch( err => {
  console.log('getCycleParksInRange rejected')
  console.log( err )
});
```

should output:

```javascript
getcycleParksNear got 3 places, eg:
{
  id: 'CyclePark_RWG232826',   
  name: 'Richmond upon Thames',
  type: 'CyclePark',
  lat: 51.470485,
  lon: -0.255915,
  standtype: 'Sheffield',
  spaces: '16',
  secure: 'FALSE',
  picurl1: 'https://cycleassetimages.data.tfl.gov.uk/RWG232826_1.jpg',
  geohash: 'gcpuf1vtk'
}
```