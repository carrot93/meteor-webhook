WebHooks
===

Quick and easy WebHook functionality for your Meteor project.

# Example Usage

Use the following code to initialize a collection to be used as a WebHook:

  ````coffeescript
  @people = new Mongo.Collection "people"
  WebHooks.init people
  ````

Now create some WebHooks:

  ````coffeescript
  WebHooks.generate
    route: "/api/v1/people/:id"
    collection: "people"
    action: "update"

  WebHooks.generate
    route: "/api/v1/people"
    collection: "people"
    action: "insert"
  ````

From a rest client, GET http://localhost:3000/api/v1/people and pass a header
parameter with the key url and a url value.  This url will now be registered to
receive data when it is inserted into the people collection. If you do not pass
the url key/value pair, the API will respond with current people data.

# TODO

* Authentication
* Register with payload rather than header (POST instead of GET?)
* Allow custom publishing, so it's possible for everyone to not see all data
* Register for delete notifications
* Delete registration
