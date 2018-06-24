const protobuf = require('protobufjs');
const path = require('path');
const fetch = require('node-fetch');
const unique = require('array-unique');
const subwayLineToFeedIdMap = require('./subwayLineToFeedIdMap');
const GTFSStopIdToStationNameMap = require('./GTFSStopIdToStationNameMap');

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

// Provided a group of feed messages, extract arrivals
// that match the provided lines and stations.
const extractRelevantArrivalsFromFeedMessages = ({ feedMessages, lines, stations }) => {
  const matches = [];
  feedMessages.forEach((feedMessage) => {
    // Skip feedMessages that don't include a trip update.
    if (!feedMessage.trip_update) {
      return false;
    }
    const line = feedMessage.trip_update.trip.route_id;
    if (!lines.includes(line)) {
      return false;
    }
    feedMessage.trip_update.stop_time_update.forEach((stopTimeUpdate) => {
      const stopIdAndDirection = stopTimeUpdate.stop_id;
      const stopId = stopIdAndDirection.substring(0, stopIdAndDirection.length - 1);
      const direction = stopIdAndDirection.substring(stopIdAndDirection.length - 1);
      const stopName = GTFSStopIdToStationNameMap[stopId];
      if (!stations.includes(stopName)) {
        return;
      }
      const arrival = {
        line,
        direction,
        stopName,
        GTFSStopId: stopId,
        time: stopTimeUpdate.arrival.time.low,
      };
      matches.push(arrival);
    });
  });
  return matches;
};

const arrivals = ({ apiKey, lines, stations }) => {
  if (typeof lines === 'string') {
    lines = [lines];
  }
  if (typeof stations === 'string') {
    stations = [stations];
  }
  return fetchLineFeeds({ apiKey, lines })
    .then((feeds) => {
      let arrivals = [];
      feeds.forEach((feed) => {
        arrivals = arrivals.concat(
          extractRelevantArrivalsFromFeedMessages({
            feedMessages: feed.entity,
            lines,
            stations,
          }),
        );
      });
      arrivals = arrivals.sort((a, b) => a.time - b.time);
      return arrivals;
    });
};

const createClient = apiKey => ({
  arrivals({ lines, stations }) {
    return arrivals({ apiKey, lines, stations });
  },
});

module.exports = {
  createClient,
};
