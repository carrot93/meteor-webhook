WebHooks
===

Quick and easy WebHook functionality for your Meteor project.

# Example Usage

Use the following code to initialize a collection to be used as a WebHook:

  ````coffeescript
  @people = new Mongo.Collection "people"

  if Meteor.isServer
    WebHooks.init people
  ````

Now create the WebHook registration API:

  ````coffeescript
  if Meteor.isServer
    WebHook.generate
      route: "/api/v1/webhooks"
  ````

From a rest client, POST the following data to
http://localhost:3000/api/v1/webhooks:

* url: "http://your/url"
* collection: "people"
* actions: "CUD"

Your URL will now be stored and anytime data is created (C), updated (U), or
deleted (D) in people, a notification of that modification will be sent to
http://your/url.

WebHook subscriptions do not expire.  However, after three consecutive failed
attempts to send notifications to a url, the WebHook is removed.  A failure is
anything besides a 200 response code (such as a 404).

# TODO

* Authentication
* Allow custom publishing, so it's possible for everyone to not see all data
* Tests
