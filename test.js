const { createClient } = require('./index');
require('dotenv').config();

const client = createClient(process.env.MTA_API_KEY);

client.departures({ lines: 'L', stations: '1 Av' })
  .then((departures) => {
    if (typeof departures[0] !== 'object') {
      throw new Error(`departures should contain object, found: \n${JSON.stringify(departures[0], null, 2)}`);
    }
  });

client.departures({ stations: '14 St - Union Sq' })
  .then((departures) => {
    if (typeof departures[0] !== 'object') {
      throw new Error(`lines option should be optional`);
    }
  });

client.departures({ stations: 'Brooklyn Bridge - City Hall' })
  .then((departures) => {
    console.log(departures);
    if (typeof departures[0] !== 'object') {
      throw new Error(`lines option should be optional`);
    }
  });

console.log('Tests complete');
