# MTA Realtime Subway Departures Client

This is a JavaScript client for New York City's MTA GTFS-realtime Subway API.

## Installation

```bash
npm install --save mta-realtime-subway-departures
```

## Usage

Call `client.departures()` to get the next subway departures for the provided `lines` and `stations`.

Supported `lines` are defined in [this file](./subwayLineToFeedIdMap.json), and `stations` defined in [this file](GTFSStopIdToStationNameMap.json).

```js
const { createClient } = require('mta-realtime-subway-departures');

// Get your API key at http://datamine.mta.info/user
const MTA_API_KEY = 'Your-API-Key-Here';
const client = createClient(MTA_API_KEY);

client.departures({
  lines: ['F', 'M'],
  stations: ['2 Av', 'Essex St', 'Delancey St']
}).then(departures => {
  console.log(departures);
});
```

`departures` data comes as an array of objects:

```js
departures = [
  { 
    line: 'F',
    direction: 'S',
    stopName: 'Delancey St',
    GTFSStopId: 'F15',
    time: 1529811805 
  },
  { 
    line: 'J',
    direction: 'N',
    stopName: 'Essex St',
    GTFSStopId: 'M18',
    time: 1529811886
  },
    // ... and more
];
```

### Departure response structure

A departure object contains the properties:

| Field                  | Description |
|------------------------|-------------|
| `line`                   | The subway line |
| `direction`              | Either `N` or `S` <br /><br />`N` means `North`, and refers to "Uptown and Bronx-bound trains" and "Times Square Shuttle to Grand Central"  <br /><br />`S` means `South`, and refers to "Downtown and Brooklyn-bound trains" and "Times Square Shuttle to Times Square" |
| `stopName`              | The stop name, as defined by the MTA's [`Stations.csv`](http://web.mta.info/developers/data/nyct/subway/Stations.csv) |
| `GTFSStopId` | The GTFS Stop ID |
| `time` | The departure time of the train in Unix time |

## External Resources

[GTFS-realtime Reference for the New York City Subway](http://datamine.mta.info/sites/all/files/pdfs/GTFS-Realtime-NYC-Subway%20version%201%20dated%207%20Sep.pdf), a document that describes the fields in the API result.

[The list of separate feed URLs](http://datamine.mta.info/list-of-feeds)