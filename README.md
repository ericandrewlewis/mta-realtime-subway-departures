# MTA Realtime Subway Departures Client

This is a JavaScript client for New York City's MTA GTFS-realtime Subway API.

## Installation

```bash
npm install --save mta-realtime-subway-departures
```

## Usage

Call `client.departures()` with a subway complex ID to get the next subway departures leaving that station.

Supported complexes are defined in [this file](https://github.com/ericandrewlewis/mta-subway-complexes/blob/master/complexes.json).

```js
const { createClient } = require('mta-realtime-subway-departures');

// Get your API key at https://api.mta.info
const MTA_API_KEY = 'Your-API-Key-Here';
const client = createClient(MTA_API_KEY);

client.departures(625)
  .then((response) => {
    console.log(response);
  });

// Also accepts an array of complex IDs.
client.departures([625, 232])
  .then((responses) => {
    // Responses is an array of response objects.
    console.log(responses);
  });
```

A `response` object includes subway departure data:

```js
{
  "complexId": 167,
  "name": "W 4 St",
  "lines": [
    {
      "name": "8th Av - Fulton St",
      "departures": {
        "S": [
          {
            "routeId": "A",
            "time": 1530134035,
            "destinationStationId": "209"
          },
          {
            "routeId": "E",
            "time": 1530134234,
            "destinationStationId": "171"
          }
        ],
        "N": [
          {
            "routeId": "C",
            "time": 1530134007,
            "destinationStationId": "302"
          },
          {
            "routeId": "E",
            "time": 1530134010,
            "destinationStationId": "278"
          }
        ]
      }
    },
    {
      "name": "6th Av - Culver",
      "departures": {
        "S": [
          {
            "routeId": "B",
            "time": 1530134084,
            "destinationStationId": "55"
          },
          {
            "routeId": "D",
            "time": 1530134272,
            "destinationStationId": "58"
          }
        ],
        "N": [
          {
            "routeId": "M",
            "time": 1530134182,
            "destinationStationId": "114"
          },
          {
            "routeId": "F",
            "time": 1530134222,
            "destinationStationId": "254"
          }
        ]
      }
    }
  ]
}

```

### Response structure

A response object contains the following properties:

| Field                  | Description |
|------------------------|-------------|
| `response.lines`             | Departures are categorized into each separate line that serves the complex (e.g. there are two lines at West 4th Street, the 6th Av - Culver BDFM line and the 8th Av - Fulton St ACE line) |
| `response.lines[index].departures` | Departures are split between north-bound and southbound trains |
| `response.lines[index].departures.N` | An array of departure objects. `N` means `North`, and refers to "Uptown and Bronx-bound trains" and "Times Square Shuttle to Grand Central" |
| `response.lines[index].departures.S` | An array of departure objects. `S` means `South`, and refers to "Downtown and Brooklyn-bound trains" and "Times Square Shuttle to Times Square" |

Each departure object includes `time`, a unix timestamp of the next departure, the `routeId`, e.g. `A`, `C` or `E` train, and `destinationStationId` where the train is headed (see [mta-subway-stations](https://www.npmjs.com/package/mta-subway-stations) for a list of stations).

## External Resources
* _note you must be logged in to view the links below_

[Using MTA Realtime Feeds](https://api.mta.info/#/HelpDocument)
[The list of separate feed URLs](https://api.mta.info/sites/all/files/pdfs/GTFS-Realtime-NYC-Subway%20version%201%20dated%207%20Sep.pdf#/subwayRealTimeFeeds)
