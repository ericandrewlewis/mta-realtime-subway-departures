const protobuf = require('protobufjs');
const path = require('path');
const fetch = require('node-fetch');
const unique = require('array-unique');
const subwayComplexes = require('mta-subway-complexes');
const subwayStations = require('mta-subway-stations');
const subwayLineToFeedIdMap = require('./subwayLineToFeedIdMap');

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

// Provided a group of feed messages, extract departures
// that match the provided lines and stations.
const addToResponseFromFeedMessages = ({ feedMessages, complexId, response }) => {
  complexId = complexId.toString();
  feedMessages.forEach((feedMessage) => {
    // Skip feedMessages that don't include a trip update.
    if (!feedMessage.trip_update) {
      return false;
    }

    const routeId = feedMessage.trip_update.trip.route_id;

    feedMessage.trip_update.stop_time_update.forEach((stopTimeUpdate) => {
      if (stopTimeUpdate.departure === null) {
        return;
      }
      const stopIdAndDirection = stopTimeUpdate.stop_id;
      const gtfsStopId = stopIdAndDirection.substring(0, stopIdAndDirection.length - 1);
      let stopTimeComplexId = gtfsStopIdToComplexId(gtfsStopId);
      if (stopTimeComplexId !== complexId) {
        return;
      }
      const direction = stopIdAndDirection.substring(stopIdAndDirection.length - 1);
      const station = gtfsStopIdToStation(gtfsStopId);
      const line = station.Line;
      if (!response.lines[line]) {
        response.lines[line] = {
          name: line,
          departures: {
            S: [],
            N: [],
          },
        };
      }
      const time = stopTimeUpdate.departure.time.low;
      const departure = {
        routeId,
        time,
      };
      response.lines[line].departures[direction].push(departure);
    });
  });
  for (key in response.lines) {
    response.lines[key].departures.S = response.lines[key].departures.S.sort((a, b) => a.time - b.time);
    response.lines[key].departures.N = response.lines[key].departures.N.sort((a, b) => a.time - b.time);
  }
  return response;
};

const linesForComplex = complexId => subwayComplexes[complexId].daytimeRoutes;

let gtfsStopIdToComplexId;
{
  const map = {};
  for (key in subwayStations) {
    const station = subwayStations[key];
    const gtfsStopId = station['GTFS Stop ID'];
    const complexId = station['Complex ID'];
    map[gtfsStopId] = complexId;
  }
  gtfsStopIdToComplexId = gtfsStopId => map[gtfsStopId];
}

let gtfsStopIdToStation;
{
  const map = {};
  subwayStations.forEach(station => {
    const gtfsStopId = station['GTFS Stop ID'];
    map[gtfsStopId] = station;
  });
  gtfsStopIdToStation = gtfsStopId => map[gtfsStopId];
}

const fetchDepartures = ({ apiKey, complexIds }) => {
  if (!Array.isArray(complexIds)) {
    complexIds = [complexIds];
  }
  let lines = [];
  complexIds.forEach(complexId => {
    lines = lines.concat(linesForComplex(complexId));
  });
  lines = unique(lines);
  return fetchLineFeeds({ apiKey, lines })
    .then((feeds) => {
      const responses = [];
      complexIds.forEach(complexId => {
        const response = {
          complexId,
          name: subwayComplexes[complexId].name,
          lines: {},
        };
        feeds.forEach((feed) => {
          addToResponseFromFeedMessages({
            feedMessages: feed.entity,
            complexId,
            response
          });
        });
        responses.push(response);
      });
      if (responses.length === 1) {
        return responses[0];
      }
      return responses;
    });
};

const createClient = apiKey => ({
  departures(complexIds) {
    return fetchDepartures({ apiKey, complexIds });
  },
});

module.exports = {
  createClient,
};
