const { createClient } = require('./index');
require('dotenv').config();

const client = createClient(process.env.MTA_API_KEY);

client.arrivals({ lines: 'L', stations: '1 Av' })
  .then((arrivals) => {
    if (typeof arrivals[0] !== 'object') {
      throw new Error(`arrivals should contain object, found: \n${JSON.stringify(arrivals[0], null, 2)}`);
    }
  });

client.arrivals({ stations: '14 St - Union Sq' })
  .then((arrivals) => {
    if (typeof arrivals[0] !== 'object') {
      throw new Error(`lines option should be optional`);
    }
  });

console.log('Tests complete');
