const fetch = require("node-fetch");
const parse = require('csv-parse');
const fs = require('fs');

const fetchStations = () => {
  return fetch('http://web.mta.info/developers/data/nyct/subway/Stations.csv')
    .then(response => response.text())
    .then(text => {
      return new Promise((resolve, reject) => {
        parse(text, {columns: true}, function(err, stations) {
          resolve(stations);
        });
      });
    });
}

const buildMap = () => {
  return fetchStations().then(stations => {
    const map = {};
    stations.forEach(station => {
      const GTFSStopId = station['GTFS Stop ID'];
      const stationName = station['Stop Name'];
      map[GTFSStopId] = stationName;
    });
    return map;
  });
}

buildMap().then(map => {
  fs.writeFile('GTFSStopIdToStationNameMap.json', JSON.stringify(map, null, 2), (err) => {
    if (err) {
      throw err;
    }
    console.log(`Complete.`);
  });
});