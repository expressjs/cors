/*jslint nodejs: true*/

'use strict';

var defaults, staticOptionsDelegate;

defaults = {
  origin: '*',
  methods: 'GET,HEAD,PUT,POST,DELETE'
};

// the default delegate is used if static options are passed into the middleware
staticOptionsDelegate = function(options){
  return function(req, cb){
    cb(null, options);
  };
};

module.exports = function(param){
  // determine whether we should use the staticOptionsDelegate or if a custom delegate was passed in
  var delegate = typeof(param) === 'function' ? param : staticOptionsDelegate(param); // the "delegate" is actually a static options object

  // provide connect with a middleware function
  return function(req, res, next){
    req.pause();

    // this is the callback that will be passed into the delegate
    var handleDelegateResponse = function(err, options){
      var config, origin, methods, headers, credentials, maxAge;
      req.resume();

      // if the delegate passed an error down to us, pass it to the next middleware
      if(err){
        return next(err);
      }

      // copy default values over from the 'defaults' hash as needed
      config = options || defaults;
      config.origin = config.origin === undefined ? defaults.origin : config.origin;
      config.methods = config.methods || defaults.methods;

      // turn ORIGIN into a string
      if(config.origin === true){
        origin = req.header('Origin'); // if .origin is *true*, reflect the request Origin
      }else{
        origin = config.origin;
      }

      // why waste time if CORS is switched off
      if(origin === false){
        return next();
      }

      // turn METHODS into a string
      if(config.methods.join){
        methods = config.methods.join(','); // .methods is an array, so turn it into a string
      }else{
        methods = config.methods;
      }

      // turn HEADERS into a string
      if(config.headers === undefined){
        headers = req.header('Access-Control-Request-Headers'); // .headers wasn't specified, so reflect the request headers
      }else if(config.headers.join){
        headers = config.headers.join(','); // .headers is an array, so turn it into a string
      }else{
        headers = config.headers;
      }

      // turn CREDENTIALS into a boolean
      credentials = config.credentials === true;

      // turn MAXAGE into a string
      maxAge = config.maxAge && config.maxAge.toString();

      // append each response header if it is present
      if(origin !== false){
        res.header('Access-Control-Allow-Origin', origin); // required
      }

      // append the allow credentials flag, if it is present
      if(credentials === true){
        res.header('Access-Control-Allow-Credentials', 'true');
      }

      // if this HTTP request is an *OPTIONS* request, short-circuit (if we're allowed to do so) rather than going to next middleware
      if('OPTIONS' === req.method){
        res.header('Access-Control-Allow-Methods', methods); // required
        if(headers && headers.length){
          res.header('Access-Control-Allow-Headers', headers);
        }
        if(maxAge && maxAge.length){
          res.header('Access-Control-Allow-Max-Age', maxAge);
        }
        res.send(204);
      }else{
        next();
      }
    };

    // call the delegate
    delegate(req, handleDelegateResponse);
  };
};
