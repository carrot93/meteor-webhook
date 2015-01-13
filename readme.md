WebHooks
===

Quick and easy WebHook functionality for your Meteor project.

# Example Usage

Use the following code to initialize a collection to be used as a WebHook:

  ````coffeescript
  @people = new Mongo.Collection "people"
  WebHooks.init people
  ````

Now create the WebHook registration API:

  ````coffeescript
  WebHook.generate
    route: "/api/v1/webhooks"
  ````

From a rest client, POST { url: "http://your/url", collection: "people" } to
http://localhost:3000/api/v1/webhooks.  Your URL will now be stored and
anytime data is created, updated, or deleted in people, a notification of that
modification will be sent to http://your/url.

# TODO

* Authentication
* Allow custom publishing, so it's possible for everyone to not see all data
* Tests
