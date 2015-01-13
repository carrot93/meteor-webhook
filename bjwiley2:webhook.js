var collections = {};
var hooks = new Mongo.Collection("hooks");

var methodDataToObject = function (data) {
  var obj = {};

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

var handleAction = function (doc, action, collectionName) {
  hooks.find({
    collection: collectionName
  }).forEach(function(hook) {
    HTTP.post(hook.url, {
      data: {
        doc: doc,
        info: {
          action: action,
          collection: collectionName,
          hookId: hook._id
        }
      }
    });
  });
};

var init = function (collection) {
  var name;
  name = collection._name;

  if (collections[name]) {
    return;
  }

  collections[name] = collection;

  collection.after.insert(function(userId, doc) {
    handleAction(doc, "create", name);
  });

  collection.after.remove(function(userId, doc) {
    handleAction(doc, "delete", name);
  });

  collection.after.update(function(userId, doc) {
    handleAction(doc, "update", name);
  });
};

var generate = function (options) {
  var collection, method;
  method = {};

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

      var duplicate = hooks.findOne({
        collection: data.collection,
        url: data.url
      });

      if(duplicate) {
        return JSON.stringify(duplicate);
      }

      var id = hooks.insert({
        collection: data.collection,
        url: data.url
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
