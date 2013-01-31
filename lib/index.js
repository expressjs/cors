var defaults = {
  origin: '*',
  methods: 'GET,PUT,POST,DELETE',
  enablePreflight: true
};

// the default delegate is used if static options are passed into the middleware
var staticOptionsDelegate = function(options){
  return function(req, cb){
    cb(null, options);
  };
};

module.exports = function(delegate){
  // determine whether we should use the staticOptionsDelegate or if a custom delegate was passed in
  var delegate = typeof(delegate) === 'function'
    ? delegate
    : staticOptionsDelegate(delegate); // the "delegate" is actually a static options object

  // provide connect with a middleware function
  return function(req, res, next){
    // this is the callback that will be passed into the delegate
    var handleDelegateResponse = function(err, options){
      // if the delegate passed an error down to us, pass it to the next middleware
      if(err){
        return next(err);
      }

      // copy default values over from the 'defaults' hash as needed
      var options = options || defaults;
      options.origin = options.origin || defaults.origin;
      options.methods = options.methods || defaults.methods;
      options.enablePreflight = options.enablePreflight === undefined
        ? defaults.enablePreflight
        : options.enablePreflight;

      // turn each option into a string
      var origin = options.origin === true // if .origin is *true*, reflect the request Origin
            ? req.header('Origin')
            : options.origin,
          methods = options.methods.join // if .methods is a string use that, otherwise expect an array
            ? options.methods.join(',')
            : options.methods,
          headers = options.headers // okay, this is a bit more complex...
            ? options.headers.length
              ? options.headers.join
                ? options.headers.join(',') // .headers is an array, so turn it into a string
                : options.headers // .headers is a string already
              : null // .headers was specified but is an empty string or empty array, so don't include
            : req.header('Access-Control-Request-Headers'), // .headers wasn't specified, so reflect the request headers
          credentials = options.credentials === true,
          maxAge = options.maxAge && options.maxAge.toString();

      // append each response header if it is present
      res.header('Access-Control-Allow-Origin', origin); // required
      res.header('Access-Control-Allow-Methods', methods); // required
      if(headers && headers.length){
        res.header('Access-Control-Allow-Headers', headers);
      }
      if(credentials === true){
        res.header('Access-Control-Allow-Credentials', 'true');
      }
      if(maxAge && maxAge.length){
        res.header('Access-Control-Allow-Max-Age', maxAge);
      }

      // if this HTTP request is an *OPTIONS* request, short-circuit (if we're allowed to do so) rather than going to next middleware
      if(options.enablePreflight && 'OPTIONS' === req.method){
        res.send(204);
      }else{
        next();
      }
    };

    // call the delegate
    delegate(req, handleDelegateResponse);
  };
};
