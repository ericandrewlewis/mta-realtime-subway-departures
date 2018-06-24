const { createClient } = require('./index');
require('dotenv').config();


try {
  const client = createClient(process.env.MTA_API_KEY);
  client.arrivals({ lines: 'L', stations: '1 Av' })
    .then((arrivals) => {
      if (typeof arrivals[0] !== 'object') {
        throw new Error(`arrivals should contain object, found: \n${JSON.stringify(arrivals[0], null, 2)}`);
      }
    });
} catch (e) {
  throw e;
}

console.log('Tests complete');
