import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('groups');
  this.route('schedule');
  this.route('bracket');
  this.route('venues');
  this.route('team', { path: '/team/:code' });
  this.route('news');
  this.route('top-scorers');
  this.route('match', { path: '/match/:id' });
});

export default Router;
