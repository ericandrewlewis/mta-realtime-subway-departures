const protobuf = require('protobufjs');
const path = require('path');
const fetch = require('node-fetch');
const unique = require('array-unique');
const subwayComplexes = require('mta-subway-complexes');
const subwayStations = require('mta-subway-stations');
const subwayLineToFeedUrlMap = require('./subwayLineToFeedUrlMap');
const destinationLocationToComplexIdMap = require('./destinationLocationToComplexIdMap');

const nyctSubwayProtoRoot = protobuf.loadSync(path.join(__dirname, 'nyct-subway.proto'));

const FeedMessage = nyctSubwayProtoRoot.lookupType("transit_realtime.FeedMessage");

const feedUrlForLine = (line) => subwayLineToFeedUrlMap[line];

const feedCache = {};

const fetchFeedUrl = (apiKey, feedUrl) => {
  if (feedCache[feedUrl]) {
    const nowInUnix = Math.floor(Date.now() / 1000);
    if (nowInUnix - feedCache[feedUrl].createdAt > 20) {
      Reflect.deleteProperty(feedCache[feedUrl]);
    } else {
      return feedCache[feedUrl].value;
    }
  }

  return fetch(feedUrl, { headers: { 'x-api-key': apiKey } })
    .then(response => response.buffer())
    .then(buffer => {
      const uint8array = new Uint8Array(buffer);
      const value = FeedMessage.decode(uint8array);
      feedCache[feedUrl] = {
        createdAt: nowInUnix = Math.floor(Date.now() / 1000),
        value
      }
      return value;
    })
}
// Fetch the API feeds for the provided subway lines.
// Returns a Promise that resolves with the JSON data for all requests.
const fetchLineFeeds = ({ apiKey, lines }) => {
  const feedUrls = unique(
    lines.map(
      line => feedUrlForLine(line),
    ),
  );
  return Promise.all(
    feedUrls.map(feedUrl => fetchFeedUrl(apiKey, feedUrl))
  );
};

const linesForComplex = complexId => subwayComplexes[complexId].daytimeRoutes;

let gtfsStopIdToComplexId;
{
  const map = {};
  subwayStations.forEach((station) => {
    const gtfsStopId = station['GTFS Stop ID'];
    const complexId = station['Complex ID'];
    map[gtfsStopId] = complexId;
  });
  gtfsStopIdToComplexId = gtfsStopId => map[gtfsStopId];
}

let gtfsStopIdToStation;
{
  const map = {};
  subwayStations.forEach((station) => {
    const gtfsStopId = station['GTFS Stop ID'];
    map[gtfsStopId] = station;
  });
  gtfsStopIdToStation = gtfsStopId => map[gtfsStopId];
}

// Provided a group of feed messages, extract departures
// that match the provided lines and stations.
const addToResponseFromFeedMessages = ({ feedMessages, complexId, response }) => {
  complexId = complexId.toString();
  const nowInUnix = Math.floor(Date.now() / 1000);
  feedMessages.forEach((feedMessage) => {
    // Skip feedMessages that don't include a trip update.
    if (!feedMessage.tripUpdate) {
      return;
    }

    const routeId = feedMessage.tripUpdate.trip.routeId;
    const trainIdExploded = feedMessage.tripUpdate.trip['.nyctTripDescriptor'].trainId.split(' ');
    const destinationLocation = trainIdExploded[trainIdExploded.length - 1 ].split('/')[1];
    const destinationStationId = destinationLocationToComplexIdMap[destinationLocation];
    feedMessage.tripUpdate.stopTimeUpdate.forEach((stopTimeUpdate) => {
      if (stopTimeUpdate.departure === null) {
        return;
      }
      const stopIdAndDirection = stopTimeUpdate.stopId;
      const gtfsStopId = stopIdAndDirection.substring(0, stopIdAndDirection.length - 1);
      const stopTimeComplexId = gtfsStopIdToComplexId(gtfsStopId);
      if (stopTimeComplexId !== complexId) {
        return;
      }
      const direction = stopIdAndDirection.substring(stopIdAndDirection.length - 1);
      const station = gtfsStopIdToStation(gtfsStopId);
      const lineName = station.Line;
      let lineIndex = response.lines.findIndex(line => line.name === lineName);
      if (lineIndex === -1) {
        response.lines.push({
          name: lineName,
          departures: {
            S: [],
            N: [],
          },
        });
        lineIndex = response.lines.length - 1;
      }
      const time = stopTimeUpdate.departure.time.low;
      if (time < nowInUnix) {
        return;
      }
      const departure = {
        routeId,
        time,
        destinationStationId
      };
      response.lines[lineIndex].departures[direction].push(departure);
    });
  });
  return response;
};

const fetchDepartures = ({ apiKey, complexIds }) => {
  if (!Array.isArray(complexIds)) {
    complexIds = [complexIds];
  }
  let lines = [];
  complexIds.forEach((complexId) => {
    lines = lines.concat(linesForComplex(complexId));
  });
  lines = unique(lines);
  return fetchLineFeeds({ apiKey, lines })
    .then((feeds) => {
      const responses = [];
      complexIds.forEach((complexId) => {
        const response = {
          complexId,
          name: subwayComplexes[complexId].name,
          lines: [],
        };
        feeds.forEach((feed) => {
          addToResponseFromFeedMessages({
            feedMessages: feed.entity,
            complexId,
            response,
          });
        });
        response.lines.forEach((line) => {
          line.departures.S = line.departures.S.sort((a, b) => a.time - b.time);
          line.departures.N = line.departures.N.sort((a, b) => a.time - b.time);
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
