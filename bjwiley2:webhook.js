(function() {

  var Hooks, collections, generate, init;

  collections = {};
  Hooks = new Mongo.Collection("Hooks");

  init = function(collection) {
    var name;
    name = collection._name;

    if (collections[name]) {
      return;
    }

    collections[name] = collection;

    collection.after.insert(function(userId, doc) {
      Hooks.find({
        collection: name,
        action: "insert"
      }).forEach(function(hook) {
        HTTP.post(hook.url, {
          data: {
            doc: doc,
            info: {
              action: "insert",
              collection: name
            }
          }
        });
      });
    });

    collection.after.update(function(userId, doc) {
      Hooks.find({
        collection: name,
        action: "update"
      }).forEach(function(hook) {
        HTTP.post(hook.url, {
          data: {
            doc: doc,
            info: {
              action: "update",
              collection: name
            }
          }
        });
      });
    });
  };

  generate = function(options) {
    var collection, method;
    method = {};
    collection = collections[options.collection];

    if (!collection) {
      throw new Meteor.Error("uninitialized", "Call WebHook.init and pass " +
        options.collection);
    }

    method[options.route] = function() {
      var id, url;
      this.setContentType("application/JSON");
      url = this.requestHeaders.url;

      if (url) {
        id = Hooks.insert({
          url: url,
          collection: collection._name,
          action: options.action
        });

        return JSON.stringify(Hooks.findOne(id));
      }

      if (this.params.id) {
        return JSON.stringify(collection.findOne(this.params.id));
      }

      return JSON.stringify(collection.find().fetch());
    };

    HTTP.methods(method);
  };

  this.WebHook = {
    init: init,
    generate: generate
  };

})();
