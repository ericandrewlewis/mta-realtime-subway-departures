const { createClient } = require('./index');
require('dotenv').config();

const client = createClient(process.env.MTA_API_KEY);

(async () => {
  try {
    let response = await client.departures(167);
    if (response.lines[0].departures.N.length < 1) {
      throw new Error(`There should be departures, none found: \n${JSON.stringify(response, null, 2)}`);
    }
    let responses = await client.departures([167, 232])
    if (responses.length !== 2) {
      throw new Error(`There should be two responses: \n${JSON.stringify(responses, null, 2)}`);
    }
  } catch(e) {
    console.error(e);
    console.log('Did you set the MTA_API_KEY from https://api.mta.info ?')
    return;
  }

  console.log('💁‍♀️ All tests pass.');
})();
