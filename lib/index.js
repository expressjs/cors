/*jslint indent: 2*/
/*global require: true, module: true*/

(function () {

  'use strict';

  var defaults = {
    origin: '*',
    methods: 'GET,HEAD,PUT,POST,DELETE'
  };

  function configureOrigin(options, req) {
    var origin = options.origin;
    if (origin === true) {
      origin = req.headers.origin;
    } else if (!origin) {
      origin = '*';
    }
    return {
      key: 'Access-Control-Allow-Origin',
      value: origin
    };
  }

  function configureMethods(options) {
    var methods = options.methods || defaults.methods;
    if (methods.join) {
      methods = options.methods.join(','); // .methods is an array, so turn it into a string
    }
    return {
      key: 'Access-Control-Allow-Methods',
      value: methods
    };
  }

  function configureCredentials(options) {
    if (options.credentials === true) {
      return {
        key: 'Access-Control-Allow-Credentials',
        value: 'true'
      };
    }
    return null;
  }

  function configureHeaders(options, req) {
    var headers = options.headers;
    if (!headers) {
      headers = req.headers['access-control-request-headers']; // .headers wasn't specified, so reflect the request headers
    } else if (headers.join) {
      headers = headers.join(','); // .headers is an array, so turn it into a string
    }
    if (headers && headers.length) {
      return {
        key: 'Access-Control-Allow-Headers',
        value: headers
      };
    }
    return null;
  }

  function configureMaxAge(options) {
    var maxAge = options.maxAge && options.maxAge.toString();
    if (maxAge && maxAge.length) {
      return {
        key: 'Access-Control-Allow-Max-Age',
        value: maxAge
      };
    }
    return null;
  }

  function cors(options, req, res, next) {
    var headers = [],
      applyHeaders = function (headers, res) {
        headers.forEach(function (header) {
          if (header && header.value) {
            res.setHeader(header.key, header.value);
          }
        });
      };

    if (req.method === 'OPTIONS') {
      headers.push(configureOrigin(options, req));
      headers.push(configureCredentials(options, req));
      headers.push(configureMethods(options, req));
      headers.push(configureHeaders(options, req));
      headers.push(configureMaxAge(options, req));
      applyHeaders(headers, res);
      res.statusCode = 204;
      res.end();
    } else {
      headers.push(configureOrigin(options, req));
      headers.push(configureCredentials(options, req));
      applyHeaders(headers, res);
      next();
    }
  }

  function middlewareWrapper(o) {
    // if no options were passed in, use the defaults
    if (!o) {
      o = {};
    }
    if (o.origin === undefined) {
      o.origin = defaults.origin;
    }
    if (o.methods === undefined) {
      o.methods = defaults.methods;
    }

    // if options are static (either via defaults or custom options passed in), wrap in a function
    var optionsCallback = null;
    if (typeof o === 'function') {
      optionsCallback = o;
    } else {
      /*jslint unparam: true*/ // `req` is part of the signature, but isn't used for this stub
      optionsCallback = function (req, cb) {
        cb(null, o);
      };
      /*jslint unparam: false*/
    }

    return function (req, res, next) {
      req.pause(); // make sure downstream middleware don't miss any data events
      optionsCallback(req, function (err, options) {
        req.resume();
        if (err) {
          next(err);
        } else {
          var originCallback = null;
          if (options.origin && typeof options.origin === 'function') {
            originCallback = options.origin;
          } else if (options.origin) {
            /*jslint unparam: true*/ // `origin` is part of the signature, but isn't used for this stub
            originCallback = function (origin, cb) {
              cb(null, options.origin);
            };
            /*jslint unparam: false*/
          }

          if (originCallback) {
            req.pause(); // make sure downstream middleware don't miss any data events
            originCallback(req.headers.origin, function (err, origin) {
              req.resume();
              if (err || !origin) {
                next(err);
              } else {
                options.origin = origin;
                cors(options, req, res, next);
              }
            });
          } else {
            next();
          }
        }
      });
    };
  }

  // can pass either an options hash, an options delegate, or nothing
  module.exports = middlewareWrapper;

}());

