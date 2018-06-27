const protobuf = require('protobufjs');
const path = require('path');
const fetch = require('node-fetch');
const unique = require('array-unique');
const subwayComplexes = require('mta-subway-complexes');
const subwayStations = require('mta-subway-stations');
const subwayLineToFeedIdMap = require('./subwayLineToFeedIdMap');
const fs = require('fs');

require('dotenv').config();

const transit = protobuf.loadProtoFile(
  path.join(__dirname, 'nyct-subway.proto'),
);
const builder = transit.build('transit_realtime');

// Construct an apiUrl for the provided subway line.
const buildFeedUrl = ({ apiKey, line }) => {
  const feedId = subwayLineToFeedIdMap[line];
  return `http://datamine.mta.info/mta_esi.php?key=${apiKey}&feed_id=${feedId}`;
};

// Fetch the API feeds for the provided subway lines.
// Returns a Promise that resolves with the JSON data for all requests.
const fetchLineFeeds = ({ apiKey, lines }) => {
  const feedUrls = unique(
    lines.map(
      line => buildFeedUrl({ apiKey, line }),
    ),
  );
  return Promise.all(
    feedUrls.map(feedUrl => fetch(feedUrl)
      .then(response => response.arrayBuffer())
      .then(buffer => builder.FeedMessage.decode(buffer))),
  );
};

const fetchPathIdentifiers = () => {
  const apiKey = process.env.MTA_API_KEY;
  fetchLineFeeds({
    apiKey,
    lines: Object.keys(subwayLineToFeedIdMap)
  })
    .then(feeds => {
      return feeds.reduce((messages, feed) => {
        return messages.concat(feed.entity);
      }, []);
    })
    .then(feedMessages => {
      return feedMessages.map(message => {
        if (!message.trip_update) {
          return null;
        }
        
        let direction;
        if (message.trip_update.trip['.nyct_trip_descriptor'].direction === 3 ) {
          direction = 'S';
        }
        if (message.trip_update.trip['.nyct_trip_descriptor'].direction === 1) {
          direction = 'N';
        }
        const exploded = message.trip_update.trip['.nyct_trip_descriptor'].train_id.split(' ');
        const destination = exploded[exploded.length - 1].split('/')[1];
        return {
          routeId: message.trip_update.trip.route_id,
          destination,
          direction
        };
      }).filter(value => value !== null);
    }).then(messages => {
      return messages.reduce((map, message) => {
        const destination = message.destination;
        map[destination] = message.routeId + " " + message.direction;
        return map;
      }, {});
    }).then(destinationMap => {
      fs.writeFile('destinations.json', JSON.stringify(destinationMap, null, 2), (err) => {
        if (err) {
          throw err;
        }
        console.log('Complete.');
      });
    });
    
};

fetchPathIdentifiers();