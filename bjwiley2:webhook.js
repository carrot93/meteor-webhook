if(Meteor.isClient) {
  return;
}

var collections = {};
var hooks = new Mongo.Collection("hooks");

var methodDataToObject = function (data) {
  var obj = {};

  if(!data) {
    return obj;
  }

  data.toString().split("&").forEach(function (n) {
    var keyValue = n.split("=");
    var key = keyValue[0];
    var value = keyValue[1];
    obj[key] = decodeURIComponent(value);
  });

  return obj;
};

var generateError = function (message) {
  this.setStatusCode(400);
  return JSON.stringify({
    success: false,
    error: true,
    message: message
  });
};

var handleAction = function (doc, action, collectionName, allowFunction) {
  query = {
    collection: collectionName
  };

  query[action] = true;

  hooks.find(query).forEach(function(hook) {
    if(allowFunction && !allowFunction(doc)) {
      return;
    }

    HTTP.post(hook.url, {
      data: {
        doc: doc,
        info: {
          action: action,
          collection: collectionName,
          hookId: hook._id
        }
      }
    }, function (error, result) {
      if(error || result.statusCode !== 200) {
        if(hook.strikes && hook.strikes < 2) {
          hooks.update({ _id: hook._id }, { $inc: { strikes: 1 } });
        }
        else {
          hooks.remove(hook._id);
        }
      }
      else if (hook.strikes) {
        hooks.update({ _id: hook._id }, { $unset: { strikes: "" } });
      }
    });
  });
};

var init = function (collection, options) {
  var name;
  name = collection._name;

  if (collections[name]) {
    throw new Meteor.Error("already initialized",
      name + " is already initialized");
  }

  collections[name] = collection;

  collection.after.insert(function(userId, doc) {
    handleAction(doc, "create", name, options.create);
  });

  collection.after.remove(function(userId, doc) {
    handleAction(doc, "delete", name, options.delete);
  });

  collection.after.update(function(userId, doc) {
    handleAction(doc, "update", name, options.update);
  });
};

var generate = function (options) {
  var collection, method;
  method = {};

  check(options, {
    route: String
  });

  method[options.route] = {
    get: function () {
      this.setContentType("application/JSON");
      return JSON.stringify(hooks.find().fetch());
    },
    delete: function (data) {
      this.setContentType("application/JSON");
      data = methodDataToObject(data);

      if(!data._id) {
        return generateError.call(this, "No _id was specified");
      }

      return JSON.stringify({
        success: hooks.remove(data._id) === 1
      });
    },
    post: function (data) {
      this.setContentType("application/JSON");
      data = methodDataToObject(data);

      if(!data.url) {
        return generateError.call(this, "No url was specified");
      }

      if(!data.collection) {
        return generateError.call(this, "No collection was specified");
      }

      if(!collections[data.collection]) {
        return generateError.call(this,
          data.collection + " is not initialized for webhooking");
      }

      if(!data.actions) {
        return generateError.call(this, "No actions were specified");
      }

      data.actions = data.actions.trim().toUpperCase();
      var create = data.actions.indexOf("C") !== -1;
      var update = data.actions.indexOf("U") !== -1;
      var deleteAction = data.actions.indexOf("D") !== -1;

      if(!(create || update || deleteAction)) {
        return generateError.call(this, "The actions were invalid");
      }

      var duplicate = hooks.findOne({
        collection: data.collection,
        url: data.url
      });

      if(duplicate) {
        duplicate.create = create;
        duplicate.update = update;
        duplicate.delete = deleteAction;
        hooks.update({ _id: duplicate._id }, duplicate);
        return JSON.stringify(duplicate);
      }

      var id = hooks.insert({
        collection: data.collection,
        url: data.url,
        create: create,
        update: update,
        delete: deleteAction
      });

      return JSON.stringify(hooks.findOne(id));
    }
  };

  HTTP.methods(method);
};

this.WebHook = {
  init: init,
  generate: generate
};
