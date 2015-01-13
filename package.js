Package.describe({
  name: 'bjwiley2:webhook',
  summary: 'Quick and easy WebHook functionality for your Meteor project.',
  version: '0.0.1',
  git: 'https://github.com/NewSpring/webhook.git'
});

Package.onUse(function(api) {
  api.use('cfs:http-methods');
  api.use('matb33:collection-hooks');
  api.versionsFrom('1.0.2.1');
  api.addFiles('bjwiley2:webhook.js');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('bjwiley2:webhook');
  api.addFiles('bjwiley2:webhook-tests.js');
});
