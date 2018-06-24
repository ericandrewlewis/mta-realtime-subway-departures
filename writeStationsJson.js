const fetch = require('node-fetch');
const parse = require('csv-parse');
const fs = require('fs');

const fetchStations = () => fetch('http://web.mta.info/developers/data/nyct/subway/Stations.csv')
  .then(response => response.text())
  .then(text => new Promise((resolve, reject) => {
    parse(text, { columns: true }, (err, stations) => {
      resolve(stations);
    });
  }));

fetchStations()
  .then((stations) => {
    fs.writeFile('stations.json', JSON.stringify(stations, null, 2), (err) => {
      if (err) {
        throw err;
      }
      console.log('Complete.');
    });
  });
