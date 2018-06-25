const { createClient } = require('./index');
require('dotenv').config();

const client = createClient(process.env.MTA_API_KEY);

client.departures(625)
  .then((response) => {
    for (line in response.lines) {
      if (response.lines[line].departures.N.length < 1) {
        throw new Error(`There should be departures, none found: \n${JSON.stringify(departures[0], null, 2)}`);
      }
    }
  });

console.log('Tests complete');
