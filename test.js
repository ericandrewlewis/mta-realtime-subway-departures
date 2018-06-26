const { createClient } = require('./index');
require('dotenv').config();

const client = createClient(process.env.MTA_API_KEY);

// West 4th street
client.departures(167)
  .then((response) => {
    if (response.lines[0].departures.N.length < 1) {
      throw new Error(`There should be departures, none found: \n${JSON.stringify(response, null, 2)}`);
    }
  });

  // Multiple complex IDs
client.departures([167, 232])
  .then((responses) => {
    if (responses.length !== 2) {
      throw new Error(`There should be two responses: \n${JSON.stringify(responses, null, 2)}`);
    }
  });

console.log('💁‍♀️ All tests pass.');
