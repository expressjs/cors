# cors

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]
[![Test Coverage][coveralls-image]][coveralls-url]

CORS is a node.js package for providing a [Connect](http://www.senchalabs.org/connect/)/[Express](http://expressjs.com/) middleware that can be used to enable [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) with various options.

**[Follow me (@troygoode) on Twitter!](https://twitter.com/intent/user?screen_name=troygoode)**

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

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/). Installation is done using the
[`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```sh
$ npm install cors
```

## Usage

### Simple Usage (Enable *All* CORS Requests)

```javascript
var express = require('express')
var cors = require('cors')
var app = express()

app.use(cors())

app.get('/products/:id', function (req, res, next) {
  res.json({msg: 'This is CORS-enabled for all origins!'})
})

app.listen(80, function () {
  console.log('CORS-enabled web server listening on port 80')
})
```

### Enable CORS for a Single Route

```javascript
var express = require('express')
var cors = require('cors')
var app = express()

app.get('/products/:id', cors(), function (req, res, next) {
  res.json({msg: 'This is CORS-enabled for a Single Route'})
})

app.listen(80, function () {
  console.log('CORS-enabled web server listening on port 80')
})
```

### Configuring CORS

```javascript
var express = require('express')
var cors = require('cors')
var app = express()

var corsOptions = {
  origin: 'http://example.com',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.get('/products/:id', cors(corsOptions), function (req, res, next) {
  res.json({msg: 'This is CORS-enabled for only example.com.'})
})

app.listen(80, function () {
  console.log('CORS-enabled web server listening on port 80')
})
```

### Configuring CORS w/ Dynamic Origin

```javascript
var express = require('express')
var cors = require('cors')
var app = express()

var whitelist = ['http://example1.com', 'http://example2.com']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

app.get('/products/:id', cors(corsOptions), function (req, res, next) {
  res.json({msg: 'This is CORS-enabled for a whitelisted domain.'})
})

app.listen(80, function () {
  console.log('CORS-enabled web server listening on port 80')
})
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
var cors = require('cors')
var app = express()

app.options('/products/:id', cors()) // enable pre-flight request for DELETE request
app.del('/products/:id', cors(), function (req, res, next) {
  res.json({msg: 'This is CORS-enabled for all origins!'})
})

app.listen(80, function () {
  console.log('CORS-enabled web server listening on port 80')
})
```

You can also enable pre-flight across-the-board like so:

```javascript
app.options('*', cors()) // include before other routes
```

### Configuring CORS Asynchronously

```javascript
var express = require('express')
var cors = require('cors')
var app = express()

var whitelist = ['http://example1.com', 'http://example2.com']
var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  if (whitelist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
  }else{
    corsOptions = { origin: false } // disable CORS for this request
  }
  callback(null, corsOptions) // callback expects two parameters: error and options
}

app.get('/products/:id', cors(corsOptionsDelegate), function (req, res, next) {
  res.json({msg: 'This is CORS-enabled for a whitelisted domain.'})
})

app.listen(80, function () {
  console.log('CORS-enabled web server listening on port 80')
})
```

### CORS and CSRF

The default configuration of this module implements the CORS specification as outlined by the W3C. That specification is not designed to prevent servers from responding to requests, but rather to allow clients to make cross-origin requests. Thus, in the case of a CORS "failure", where the request's origin is not allowed, the browser will refuse to deliver the response _after_ the server responds as if the request had been valid.

Thus, CORS is not a defense against [CSRF](https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF)): even if cross-origin rules prevent the attacker from seeing the response to the forged request, the attacker can modify state or force the server to perform some expensive calculation, thus causing a denial of service.

However, this module can be configured to short-circuit the request in case of CORS failures, thus implementing basic CSRF protection [as recommended by the OWASP](https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF)_Prevention_Cheat_Sheet#Checking_the_Origin_Header). To do this, configure this module with `mismatchContinue: false`:

```js
var express = require('express');
var cors = require('cors');
var app = express();

// `mismatchContinue: false` will work with any of the `origin` options supported
// by this module. However it won't help prevent CSRF unless you whitelist specific
// origins. Also see caveats below!
var whitelist = ['https://same-origin.com', 'https://other-origin.com'];

app.del('/products/:id', cors({ origin: whitelist, mismatchContinue: false }), function (req, res, next) {
  res.json({msg: 'This will not be executed if called from https://evil-origin.com.'});
});

app.listen(80, function () {
  console.log('CORS-enabled and CSRF-protected web server listening on port 80');
});
```

Make sure to whitelist cross-origin AND same-origin requests, since the middleware will reject any request whose origin is not on the list. This also means that the middleware will reject requests with _missing_ origins. This means that `mismatchContinue: false` is NOT SUITED for routes where the `Origin` header may be missing, e.g. routes loaded directly by users in the browser, or routes loaded by `<img>` tags. However AJAX requests should [always have `Origin` headers](https://bugs.chromium.org/p/chromium/issues/detail?id=512836#c3).

If you don't want to enable a route for cross-origin usage but you _do_ wish to verify same-origin usage, you can apply this module to that route with _only_ the same origin whitelisted.

## Configuration Options

* `origin`: Configures the **Access-Control-Allow-Origin** CORS header. Possible values:
  - `Boolean` - set `origin` to `true` to reflect the [request origin](http://tools.ietf.org/html/draft-abarth-origin-09), as defined by `req.header('Origin')`, or set it to `false` to disable CORS.
  - `String` - set `origin` to a specific origin. For example if you set it to `"http://example.com"` only requests from "http://example.com" will be allowed.
  - `RegExp` - set `origin` to a regular expression pattern which will be used to test the request origin. If it's a match, the request origin will be reflected. For example the pattern `/example\.com$/` will reflect any request that is coming from an origin ending with "example.com".
  - `Array` - set `origin` to an array of valid origins. Each origin can be a `String` or a `RegExp`. For example `["http://example1.com", /\.example2\.com$/]` will accept any request from "http://example1.com" or from a subdomain of "example2.com".
  - `Function` - set `origin` to a function implementing some custom logic. The function takes the request origin as the first parameter and a callback (which expects the signature `err [object], allow [bool]`) as the second. If the function calls back with `allow === false`, CORS will not be enabled for the response, but the next handler will still run unless `mismatchContinue === false`.
* `methods`: Configures the **Access-Control-Allow-Methods** CORS header. Expects a comma-delimited string (ex: 'GET,PUT,POST') or an array (ex: `['GET', 'PUT', 'POST']`).
* `allowedHeaders`: Configures the **Access-Control-Allow-Headers** CORS header. Expects a comma-delimited string (ex: 'Content-Type,Authorization') or an array (ex: `['Content-Type', 'Authorization']`). If not specified, defaults to reflecting the headers specified in the request's **Access-Control-Request-Headers** header.
* `exposedHeaders`: Configures the **Access-Control-Expose-Headers** CORS header. Expects a comma-delimited string (ex: 'Content-Range,X-Content-Range') or an array (ex: `['Content-Range', 'X-Content-Range']`). If not specified, no custom headers are exposed.
* `credentials`: Configures the **Access-Control-Allow-Credentials** CORS header. Set to `true` to pass the header, otherwise it is omitted.
* `maxAge`: Configures the **Access-Control-Max-Age** CORS header. Set to an integer to pass the header, otherwise it is omitted.
* `preflightContinue`: Pass the CORS preflight response to the next handler.
* `optionsSuccessStatus`: Provides a status code to use for successful `OPTIONS` requests, since some legacy browsers (IE11, various SmartTVs) choke on `204`.
* `mismatchContinue`: `true` to call the next handler even if `req.headers.origin` is missing or doesn't match `origin`, `false` to end the request with `mismatchStatus`.
* `mismatchStatus`: Provides a status code to use for requests with missing or invalid `Origin` headers when `mismatchContinue === false`. Defaults to 400.

The default configuration is the equivalent of:

```json
{
  "origin": "*",
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  "preflightContinue": false,
  "optionsSuccessStatus": 204,
  "mismatchContinue": true,
  "mismatchStatus": 400
}
```

For details on the effect of each CORS header, read [this](http://www.html5rocks.com/en/tutorials/cors/) article on HTML5 Rocks.

## Demo

A demo that illustrates CORS working (and not working) using jQuery is available here: [http://node-cors-client.herokuapp.com/](http://node-cors-client.herokuapp.com/)

Code for that demo can be found here:

* Client: [https://github.com/TroyGoode/node-cors-client](https://github.com/TroyGoode/node-cors-client)
* Server: [https://github.com/TroyGoode/node-cors-server](https://github.com/TroyGoode/node-cors-server)

## License

[MIT License](http://www.opensource.org/licenses/mit-license.php)

## Author

[Troy Goode](https://github.com/TroyGoode) ([troygoode@gmail.com](mailto:troygoode@gmail.com))

[coveralls-image]: https://img.shields.io/coveralls/expressjs/cors/master.svg
[coveralls-url]: https://coveralls.io/r/expressjs/cors?branch=master
[downloads-image]: https://img.shields.io/npm/dm/cors.svg
[downloads-url]: https://npmjs.org/package/cors
[npm-image]: https://img.shields.io/npm/v/cors.svg
[npm-url]: https://npmjs.org/package/cors
[travis-image]: https://img.shields.io/travis/expressjs/cors/master.svg
[travis-url]: https://travis-ci.org/expressjs/cors
