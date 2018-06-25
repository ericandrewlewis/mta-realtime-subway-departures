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

// Get your API key at http://datamine.mta.info/user
const MTA_API_KEY = 'Your-API-Key-Here';
const client = createClient(MTA_API_KEY);

client.departures(625)
  .then((response) => {
    console.log(response);
  });
```

A `response` object includes subway departure data:

```js
{
  "complexId": 625,
  "name": "Delancey St / Essex St",
  "lines": {
    "Jamaica": {
      "name": "Jamaica",
      "departures": {
        "S": [
          {
            "routeId": "J",
            "time": 1529893528
          },
          {
            "routeId": "M",
            "time": 1529893530
          }
        ],
        "N": [
          {
            "routeId": "J",
            "time": 1529892874
          },
          {
            "routeId": "M",
            "time": 1529893154
          }
        ]
      }
    },
    "6th Av - Culver": {
      "name": "6th Av - Culver",
      "departures": {
        "S": [
          {
            "routeId": "F",
            "time": 1529892957
          },
          {
            "routeId": "F",
            "time": 1529893669
          }
        ],
        "N": [
          {
            "routeId": "F",
            "time": 1529892949
          },
          {
            "routeId": "F",
            "time": 1529893734
          }
        ]
      }
    }
  }
}
```

### Response structure

A response object contains the following properties:

| Field                  | Description |
|------------------------|-------------|
| `response.lines`             | Departures are categorized into each separate line that serves the complex (e.g. there are two lines at Essex St-Delancey St, the Jamaica-Broad St JMZ line and the 6th Avenue F line) |
| `response.lines[lineName].departures` | Departures are split between north-bound and southbound trains |
| `response.lines[lineName].departures.N` | An array of departure objects. `N` means `North`, and refers to "Uptown and Bronx-bound trains" and "Times Square Shuttle to Grand Central" |
| `response.lines[lineName].departures.S` | An array of departure objects. `S` means `South`, and refers to "Downtown and Brooklyn-bound trains" and "Times Square Shuttle to Times Square" |

Each departure object includes `time`, a unix timestamp of the next departure, and the `routeId`, e.g. `A`, `C` or `E` train.

## External Resources

[GTFS-realtime Reference for the New York City Subway](http://datamine.mta.info/sites/all/files/pdfs/GTFS-Realtime-NYC-Subway%20version%201%20dated%207%20Sep.pdf), a document that describes the fields in the API result.

[The list of separate feed URLs](http://datamine.mta.info/list-of-feeds)