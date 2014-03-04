# `cors`

CORS is a node.js package for providing a [Connect](http://www.senchalabs.org/connect/)/[Express](http://expressjs.com/) middleware that can be used to enable [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) with various options.

**[Follow me (@troygoode) on Twitter!](https://twitter.com/intent/user?screen_name=troygoode)**

[![NPM](https://nodei.co/npm/cors.png?downloads=true&stars=true)](https://nodei.co/npm/cors/)

[![build status](https://secure.travis-ci.org/troygoode/node-cors.png)](http://travis-ci.org/troygoode/node-cors)
* [Installation](#installation)
* [Usage](#usage)
  * [Simple Usage](#simple-usage-enable-all-cors-requests)
  * [Enable CORS for a Single Route](#enable-cors-for-a-single-route)
  * [Configuring CORS](#configuring-cors)
  * [Configuring CORS Asynchronously](#configuring-cors-asynchronously)
  * [Enabling CORS Pre-Flight](#enabling-cors-pre-flight)
* [Configuration Options](#configuration-options)
* [Demo](#demo)
* [License](#license)
* [Author](#author)

## Installation (via [npm](https://npmjs.org/package/cors))

```bash
$ npm install cors
```

## Usage

### Simple Usage (Enable *All* CORS Requests)

```javascript
var express = require('express')
  , cors = require('cors')
  , app = express();

app.use(cors());
app.use(app.router);

app.get('/products/:id', function(req, res, next){
  res.json({msg: 'This is CORS-enabled for all origins!'});
});

app.listen(80, function(){
  console.log('CORS-enabled web server listening on port 80');
});
```

### Enable CORS for a Single Route

```javascript
var express = require('express')
  , cors = require('cors')
  , app = express();

app.get('/products/:id', cors(), function(req, res, next){
  res.json({msg: 'This is CORS-enabled for all origins!'});
});

app.listen(80, function(){
  console.log('CORS-enabled web server listening on port 80');
});
```

### Configuring CORS

```javascript
var express = require('express')
  , cors = require('cors')
  , app = express();

var corsOptions = {
  origin: 'http://example.com'
};

app.get('/products/:id', cors(corsOptions), function(req, res, next){
  res.json({msg: 'This is CORS-enabled for only example.com.'});
});

app.listen(80, function(){
  console.log('CORS-enabled web server listening on port 80');
});
```

### Configuring CORS w/ Dynamic Origin

```javascript
var express = require('express')
  , cors = require('cors')
  , app = express();

var whitelist = ['http://example1.com', 'http://example2.com'];
var corsOptions = {
  origin: function(origin, callback){
    var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
    callback(null, originIsWhitelisted);
  }
};

app.get('/products/:id', cors(corsOptions), function(req, res, next){
  res.json({msg: 'This is CORS-enabled for a whitelisted domain.'});
});

app.listen(80, function(){
  console.log('CORS-enabled web server listening on port 80');
});
```

### Enabling CORS Pre-Flight

Certain CORS requests are considered 'complex' and require an initial
`OPTIONS` request (called the "pre-flight request"). An example of a
'complex' CORS request is one that uses an HTTP verb other than
GET/HEAD/POST (such as DELETE) or that uses custom headers. To enable
pre-flighting, you must add a new OPTIONS handler for the route you want
to support:

```javascript
var express = require('express')
  , cors = require('cors')
  , app = express();

app.options('/products/:id', cors()); // enable pre-flight request for DELETE request
app.del('/products/:id', cors(), function(req, res, next){
  res.json({msg: 'This is CORS-enabled for all origins!'});
});

app.listen(80, function(){
  console.log('CORS-enabled web server listening on port 80');
});
```

You can also enable pre-flight across-the-board like so:

```
app.options('*', cors()); // include before other routes
```

### Configuring CORS Asynchronously

```javascript
var express = require('express')
  , cors = require('cors')
  , app = express();

var whitelist = ['http://example1.com', 'http://example2.com'];
var corsOptionsDelegate = function(req, callback){
  var corsOptions;
  if(whitelist.indexOf(req.header('Origin')) !== -1){
    corsOptions = { origin: true }; // reflect (enable) the requested origin in the CORS response
  }else{
    corsOptions = { origin: false }; // disable CORS for this request
  }
  callback(null, corsOptions); // callback expects two parameters: error and options
};

app.get('/products/:id', cors(corsOptionsDelegate), function(req, res, next){
  res.json({msg: 'This is CORS-enabled for a whitelisted domain.'});
});

app.listen(80, function(){
  console.log('CORS-enabled web server listening on port 80');
});
```

## Configuration Options

* `origin`: Configures the **Access-Control-Allow-Origin** CORS header. Expects a string (ex: "http://example.com"). Set to `true` to reflect the [request origin](http://tools.ietf.org/html/draft-abarth-origin-09), as defined by `req.header('Origin')`. Set to `false` to disable CORS. Can also be set to a function, which takes the request origin as the first parameter and a callback (which expects the signature `err [object], allow [bool]`) as the second.
* `methods`: Configures the **Access-Control-Allow-Methods** CORS header. Expects a comma-delimited string (ex: 'GET,PUT,POST') or an array (ex: `['GET', 'PUT', 'POST']`).
* `allowedHeaders`: Configures the **Access-Control-Allow-Headers** CORS header. Expects a comma-delimited string (ex: 'Content-Type,Authorization') or an array (ex: `['Content-Type', 'Authorization]`). If not specified, defaults to reflecting the headers specified in the request's **Access-Control-Request-Headers** header.
* `exposedHeaders`: Configures the **Access-Control-Expose-Headers** CORS header. Expects a comma-delimited string (ex: 'Content-Range,X-Content-Range') or an array (ex: `['Content-Range', 'X-Content-Range]`). If not specified, no custom headers are exposed.
* `credentials`: Configures the **Access-Control-Allow-Credentials** CORS header. Set to `true` to pass the header, otherwise it is omitted.
* `maxAge`: Configures the **Access-Control-Allow-Max-Age** CORS header. Set to an integer to pass the header, otherwise it is omitted.

For details on the effect of each CORS header, [read this article on HTML5 Rocks](http://www.html5rocks.com/en/tutorials/cors/).

## Demo

A demo that illustrates CORS working (and not working) using jQuery is available here: [http://node-cors-client.herokuapp.com/](http://node-cors-client.herokuapp.com/)

Code for that demo can be found here:

* Client: [https://github.com/TroyGoode/node-cors-client](https://github.com/TroyGoode/node-cors-client)
* Server: [https://github.com/TroyGoode/node-cors-server](https://github.com/TroyGoode/node-cors-server)

## License

[MIT License](http://www.opensource.org/licenses/mit-license.php)

## Author

[Troy Goode](https://github.com/TroyGoode) ([troygoode@gmail.com](mailto:troygoode@gmail.com))
