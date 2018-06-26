const { createClient } = require('./index');
require('dotenv').config();

const client = createClient(process.env.MTA_API_KEY);

// West 4th street
client.departures(167)
  .then((response) => {
    if (!response.lines['6th Av - Culver']) {
      throw new Error(`There should be departures for the 6th Av - Culver line, none found: \n${JSON.stringify(response, null, 2)}`);
    }
    if (!response.lines['8th Av - Fulton St']) {
      throw new Error(`There should be departures for the 8th Av - Fulton St line, none found: \n${JSON.stringify(response, null, 2)}`);
    }
  });

  // Multiple complex IDs
  client.departures([167, 232])
  .then((responses) => {
    if (responses.length !== 2) {
      throw new Error(`There should be two responses: \n${JSON.stringify(response, null, 2)}`);
    }
  });

console.log('💁‍♀️ All tests pass.');
