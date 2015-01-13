Package.describe({
  name: 'bjwiley2:webhook',
  summary: 'Quick and easy WebHook functionality for your Meteor project.',
  version: '0.0.4',
  git: 'https://github.com/NewSpring/webhook.git'
});

Package.onUse(function(api) {
  api.use('meteor-platform@1.2.1');
  api.use('cfs:http-methods@0.0.27');
  api.use('matb33:collection-hooks@0.7.7');
  api.addFiles('bjwiley2:webhook.js');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('bjwiley2:webhook');
  api.addFiles('bjwiley2:webhook-tests.js');
});
