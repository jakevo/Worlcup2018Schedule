'use strict';

module.exports = function(environment) {
  let ENV = {
    modulePrefix: 'world-cup2026-schedule',
    environment,
    rootURL: '/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      },
      EXTEND_PROTOTYPES: {
        // Prevent Ember Data from overriding Date.parse.
        Date: false
      }
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },

    // Data source for tournament teams + schedule.
    //
    // To switch to live api-football data, stand up the Cloudflare
    // Worker in proxy/cloudflare-worker.js (it holds the api-sports
    // key server-side) and point proxyUrl at it:
    //
    //   dataProvider: {
    //     kind: 'api-football',
    //     proxyUrl: 'https://wc2026-proxy.yoursub.workers.dev'
    //   }
    //
    // Never put `apiKey` here in a deployed build — it would ship
    // to every browser. apiKey is only OK for local dev builds you
    // never push.
    dataProvider: {
      kind: 'static'
    }
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
    ENV.APP.autoboot = false;
  }

  if (environment === 'production') {
    // here you can enable a production-specific feature
  }

  return ENV;
};
