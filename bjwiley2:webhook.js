if(!Meteor.isServer) {
  return;
}

var extend = Npm.require("extend");
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

var generateAuthenticationError = function () {
  this.setStatusCode(401);
  return JSON.stringify(getErrorObject("Invalid credentials"));
};

var generateError = function (message) {
  this.setStatusCode(400);
  return JSON.stringify(getErrorObject(message));
};

var getErrorObject = function (message) {
  return {
    success: false,
    error: true,
    message: message
  };
};

var handleAction = function (doc, action, collectionName, allowFunction) {
  query = {
    collection: collectionName
  };

  query[action] = true;

  hooks.find(query).forEach(function(hook) {
    if(allowFunction && !allowFunction(doc, hook.userId)) {
      return;
    }

    options = {
      data: {
        doc: doc,
        info: {
          action: action,
          collection: collectionName,
          hookId: hook._id
        }
      }
    };

    if(hook.token && hook.tokenName) {
      options.headers = {};
      options.headers[hook.tokenName] = hook.token;
    }

    HTTP.post(hook.url, options, function (error, result) {
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
    throw new Meteor.Error("already-initialized",
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
  var defaults = {
    route: "/webhooks",
    authentication: function () { return false; }
  };

  var settings = extend( {}, defaults, options );

  check(settings, {
    route: String,
    authentication: Function
  });

  var method = {};

  method[settings.route] = {
    get: function () {
      this.setContentType("application/JSON");
      var query = {};
      var result = settings.authentication(this.requestHeaders);

      if(!result) {
        return generateAuthenticationError.call(this);
      }

      var user = Meteor.users.findOne(result);

      if(!user) {
        return generateAuthenticationError.call(this);
      }

      query.userId = user._id;

      var hookDocs = hooks.find(query).fetch();
      return JSON.stringify(hookDocs);
    },
    delete: function (data) {
      this.setContentType("application/JSON");
      data = methodDataToObject(data);
      var query = {};
      var result = settings.authentication(this.requestHeaders);

      if(!result) {
        return generateAuthenticationError.call(this);
      }

      var user = Meteor.users.findOne(result);

      if(!user) {
        return generateAuthenticationError.call(this);
      }

      query.userId = user._id;

      if(!data._id) {
        return generateError.call(this, "No _id was specified");
      }

      query._id = data._id;

      return JSON.stringify({
        success: hooks.remove(query) === 1
      });
    },
    post: function (data) {
      this.setContentType("application/JSON");
      data = methodDataToObject(data);
      var result = settings.authentication(this.requestHeaders);

      if(!result) {
        return generateAuthenticationError.call(this);
      }

      var user = Meteor.users.findOne(result);

      if(!user) {
        return generateAuthenticationError.call(this);
      }

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

      var query = {
        collection: data.collection,
        url: data.url
      };

      query.userId = user._id;
      var duplicate = hooks.findOne(query);

      if(duplicate) {
        duplicate.create = create;
        duplicate.update = update;
        duplicate.delete = deleteAction;
        hooks.update({ _id: duplicate._id }, duplicate);
        return JSON.stringify(duplicate);
      }

      query.create = create;
      query.update = update;
      query.delete = deleteAction;

      if(data.tokenName && data.token) {
        query.tokenName = data.tokenName
        query.token = data.token
      }

      var id = hooks.insert(query);
      return JSON.stringify(hooks.findOne(id));
    }
  };

  HTTP.methods(method);
};

this.WebHook = {
  init: init,
  generate: generate
};
