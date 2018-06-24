const fetch = require("node-fetch");
const parse = require('csv-parse');

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