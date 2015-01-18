WebHooks
===

Quick and easy WebHook functionality for your Meteor project.

# Example Usage

Use the following code to initialize a collection to be used as a WebHook:

  ````coffeescript
  @people = new Mongo.Collection "people"

  if Meteor.isServer
    WebHook.init people,
      create: (doc, subscriberUserId) ->
        return doc.lastName isnt "Smith"
      update: (doc, subscriberUserId) ->
        return true
      delete: (doc, subscriberUserId) ->
        return doc.ownerId is subscriberUserId
  ````

Now create the WebHook registration API:

  ````coffeescript
  if Meteor.isServer
    WebHook.generate
      route: "/api/v1/webhooks"
      authentication: true
  ````

From a rest client, POST the following data to
http://localhost:3000/api/v1/webhooks:

* url: "http://your/url"
* collection: "people"
* actions: "CUD"
* email: "somebody@somewhere.com"
* password: "supersecret"

Your URL will now be stored and anytime data is created (C), updated (U), or
deleted (D) in people, a notification of that modification will be sent to
http://your/url.

WebHook subscriptions do not expire.  However, after three consecutive failed
attempts to send notifications to a url, the WebHook is removed.  A failure is
anything besides a 200 response code (such as a 404).

An account must have already been created for somebody@somewhere.com using the
accounts-password package (https://atmospherejs.com/meteor/accounts-password).

# API

  ````javascript
  WebHook.init(collection, [options])
  ````

  *collection*: An instance of a Mongo.Collection that the WebHook will observe
  for data changes

  *options*: An object. Valid properties include create, delete, and update.
  These properties should be set to functions that, given the document and the
  subscriber's user id, return true to allow the document to be published.
  Returning false will deny the document modification from being published to
  the particular subscriber. NOTE: this does not allow/deny the document from
  actually being modified, just the modification being published to the WebHook
  subscriber identified by the subscriberUserId.

  ````javascript
  WebHook.generate(options)
  ````

  *options*: An object. Currently the only valid options are a string value for
  route and a boolean value for authentication. The route is the URL where
  subscribers can manage their WebHook subscriptions. GET will retrieve all of
  the subscriptions. POST allows creating subscriptions. DELETE removes a
  subscription. If authentication is true, then every API request will require
  a plain-text email and password. SSL is important because of this plain-text
  nature of credential passing.
