# world-cup2026-schedule

An Ember app for the 2026 FIFA World Cup (Canada, Mexico & USA).

Features:

* Full group stage standings for all 12 groups (48 teams), computed live from match results.
* Complete match schedule grouped by kickoff date, with scores shown as soon as each match finishes.
* Curated news hub linking to trusted football desks covering the tournament.

Match data is pulled from the open-source [`openfootball/worldcup.json`](https://github.com/openfootball/worldcup.json) feed, so scores update automatically as the community maintains the dataset during the tournament. Team metadata (flags, FIFA codes) is served locally from `public/data.json`.

## Prerequisites

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) (with npm)
* [Ember CLI](https://ember-cli.com/)

## Installation

* `git clone <repository-url>` this repository
* `cd world-cup2026-schedule`
* `npm install`

## Running / Development

* `ember serve`
* Visit the app at [http://localhost:4200](http://localhost:4200).

### Running Tests

* `ember test`
* `ember test --server`

### Linting

* `npm run lint:js`

### Building

* `ember build --environment production`
