/*jslint indent: 2*/
/*global require: true, module: true*/

(function () {

  'use strict';

  var vary = require('vary'),
    defaults = {
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'
    };

  function configureOrigin(options, req) {
    if (!options.origin) {
      return {
        key: 'Access-Control-Allow-Origin',
        value: '*'
      };
    } else {
      return [
        {
          key: 'Access-Control-Allow-Origin',
          value: options.origin === true ? req.headers.origin : options.origin
        },
        {
          key: 'Vary',
          value: 'Origin'
        }
      ];
    }
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

  function configureAllowedHeaders(options, req) {
    var headers = options.allowedHeaders || options.headers;
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

  function configureExposedHeaders(options, req) {
    var headers = options.exposedHeaders;
    if (!headers) {
      return null;
    } else if (headers.join) {
      headers = headers.join(','); // .headers is an array, so turn it into a string
    }
    if (headers && headers.length) {
      return {
        key: 'Access-Control-Expose-Headers',
        value: headers
      };
    }
    return null;
  }

  function configureMaxAge(options) {
    var maxAge = options.maxAge && options.maxAge.toString();
    if (maxAge && maxAge.length) {
      return {
        key: 'Access-Control-Max-Age',
        value: maxAge
      };
    }
    return null;
  }

  function applyHeaders(headers, res) {
    for (var i = 0, n = headers.length; i < n; i++) {
      var header = headers[i];
      if (header) {
        if (Array.isArray(header)) {
          applyHeaders(header, res);
        } else if (header.key === 'Vary' && header.value) {
          vary(res, header.value);
        } else if (header.value) {
          res.setHeader(header.key, header.value);
        }
      }
    }
  }

  function cors(options, req, res, next) {
    var headers = [],
      method = req.method && req.method.toUpperCase && req.method.toUpperCase();

    if (method === 'OPTIONS') {
      // preflight
      headers.push(configureOrigin(options, req));
      headers.push(configureCredentials(options, req));
      headers.push(configureMethods(options, req));
      headers.push(configureAllowedHeaders(options, req));
      headers.push(configureMaxAge(options, req));
      applyHeaders(headers, res);
      res.statusCode = 204;
      res.end();
    } else {
      // actual response
      headers.push(configureOrigin(options, req));
      headers.push(configureCredentials(options, req));
      headers.push(configureExposedHeaders(options, req));
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
      optionsCallback(req, function (err, options) {
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
            originCallback(req.headers.origin, function (err, origin) {
              if (err || !origin) {
                next(err);
              } else {
                var corsOptions = Object.create(options);
                corsOptions.origin = origin;
                cors(corsOptions, req, res, next);
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
