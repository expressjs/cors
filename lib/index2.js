/*jslint nodejs: true*/

var defaults = {
  origin: '*',
  methods: 'GET,HEAD,PUT,POST,DELETE'
};

function configureOrigin(options, req){
  return {
    key: 'Access-Control-Allow-Origin',
    value: options.origin === true ? req.header('Origin') : options.origin
  };
}

function configureMethods(options, req){
  var methods = options.methods || defaults.methods;
  if(methods.join){
    methods = options.methods.join(','); // .methods is an array, so turn it into a string
  }
  return {
    key: 'Access-Control-Allow-Methods',
    value: methods
  };
}

function configureCredentials(options, req){
  if(options.credentials === true){
    return {
      key: 'Access-Control-Allow-Credentials',
      value: 'true'
    };
  }else{
    return null;
  }
}

function configureHeaders(options, req){
  var headers;
  if(options.headers === undefined){
    headers = req.header('Access-Control-Request-Headers'); // .headers wasn't specified, so reflect the request headers
  }else if(options.headers.join){
    headers = options.headers.join(','); // .headers is an array, so turn it into a string
  }else{
    headers = options.headers;
  }
  if(headers && headers.length){
    return {
      key: 'Access-Control-Allow-Headers',
      value: headers
    };
  }else{
    return null;
  }
}

function configureMaxAge(options, req){
  var maxAge = options.maxAge && options.maxAge.toString();
  if(maxAge && maxAge.length){
    return {
      key: 'Access-Control-Allow-Max-Age',
      value: maxAge
    };
  }else{
    return null;
  }
}

function cors(options, req, res, next){
  var applyHeaders = function(headers, res){
    headers.forEach(function(header){
      if(header && header.value){
        res.header(header.key, header.value);
      }
    });
  };

  var headers = [];
  if(req.method === 'OPTIONS'){
    headers.push(configureOrigin(options, req));
    headers.push(configureCredentials(options, req));
    headers.push(configureMethods(options, req));
    headers.push(configureHeaders(options, req));
    headers.push(configureMaxAge(options, req));
    applyHeaders(headers, res);
    res.send(204);
  }else{
    headers.push(configureOrigin(options, req));
    headers.push(configureCredentials(options, req));
    applyHeaders(headers, res);
    next();
  }
}

function middlewareWrapper(o){
  // if no options were passed in, use the defaults
  if(!o){
    o = {
      origin: defaults.origin,
      methods: defaults.methods
    };
  }

  // if options are static (either via defaults or custom options passed in), wrap in a function
  var optionsCallback = null;
  if(typeof(o) === 'function'){
    optionsCallback = o;
  }else{
    optionsCallback = function(req, cb){
      cb(null, o);
    };
  }

  return function(req, res, next){
    req.pause(); // make sure downstream middleware don't miss any data events
    optionsCallback(req, function(err, options){
      req.resume();
      if(err){
        next(err);
      }else{
        var originCallback = null;
        if(options.origin && typeof(options.origin) === 'function'){
          originCallback = options.origin;
        }else if(options.origin){
          originCallback = function(origin, cb){
            cb(null, options.origin);
          };
        }

        if(originCallback){
          req.pause(); // make sure downstream middleware don't miss any data events
          originCallback(req.header('Origin'), function(err, origin){
            req.resume();
            if(err || !origin){
              next(err);
            }else{
              options.origin = origin;
              cors(options, req, res, next);
            }
          });
        }else{
          next();
        }
      }
    });
  };
}

// can pass either an options hash, an options delegate, or nothing
module.exports = middlewareWrapper;

