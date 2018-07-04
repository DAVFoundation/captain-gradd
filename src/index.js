const Gradd = require('./gradd');
const stationIds = require('./station-id');

const isValidStation = station => station.stationId && station.location.latitude && station.location.longitude;

const graddFactory = station => {
    const gradd = new Gradd();
    gradd.init(station).catch(err => console.log(err));
    return gradd;
}

const stationFactory = locations =>
 (stationId, index) => ({
    stationId,
    location: {
        latitude: locations[index],
        longitude: locations[index + 1]
    } 
});

const locations = process.env.GRADD_LOCATION   
    .split(',')
    .map(v => parseFloat(v));

const stations = stationIds
    .map(stationFactory(locations))
    .filter(isValidStation)
    .map(graddFactory);

module.exports = stations;