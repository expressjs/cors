# cors

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][github-actions-ci-image]][github-actions-ci-url]
[![Test Coverage][coveralls-image]][coveralls-url]

CORS is a node.js package for providing a [Connect](http://www.senchalabs.org/connect/)/[Express](http://expressjs.com/) middleware that can be used to enable [CORS](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) with various options.

**[Follow me (@troygoode) on Twitter!](https://twitter.com/intent/user?screen_name=troygoode)**

* [Installation](#installation)
* [Usage](#usage)
  * [Simple Usage](#simple-usage-enable-all-cors-requests)
  * [Enable CORS for a Single Route](#enable-cors-for-a-single-route)
  * [Configuring CORS](#configuring-cors)
  * [Configuring CORS w/ Dynamic Origin](#configuring-cors-w-dynamic-origin)
  * [Enabling CORS Pre-Flight](#enabling-cors-pre-flight)
  * [Configuring CORS Asynchronously](#configuring-cors-asynchronously)
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

This module supports validating the origin dynamically using a function provided
to the `origin` option. This function will be passed a string that is the origin
(or `undefined` if the request has no origin), and a `callback` with the signature
`callback(error, origin)`.

The `origin` argument to the callback can be any value allowed for the `origin`
option of the middleware, except a function. See the
[configuration options](#configuration-options) section for more information on all
the possible value types.

This function is designed to allow the dynamic loading of allowed origin(s) from
a backing datasource, like a database.

```javascript
var express = require('express')
var cors = require('cors')
var app = express()

var corsOptions = {
  origin: function (origin, callback) {
    // db.loadOrigins is an example call to load
    // a list of origins from a backing database
    db.loadOrigins(function (error, origins) {
      callback(error, origins)
    })
  }
}

app.get('/products/:id', cors(corsOptions), function (req, res, next) {
  res.json({msg: 'This is CORS-enabled for an allowed domain.'})
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

NOTE: When using this middleware as an application level middleware (for
example, `app.use(cors())`), pre-flight requests are already handled for all
routes.

### Configuring CORS Asynchronously

```javascript
var express = require('express')
var cors = require('cors')
var app = express()

var allowlist = ['http://example1.com', 'http://example2.com']
var corsOptionsDelegate = function (req, callback) {
  var corsOptions;
  if (allowlist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true } // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false } // disable CORS for this request
  }
  callback(null, corsOptions) // callback expects two parameters: error and options
}

app.get('/products/:id', cors(corsOptionsDelegate), function (req, res, next) {
  res.json({msg: 'This is CORS-enabled for an allowed domain.'})
})

app.listen(80, function () {
  console.log('CORS-enabled web server listening on port 80')
})
```

## Configuration Options

* `origin`: Configures the **Access-Control-Allow-Origin** CORS header. Possible values:
  - `Boolean` - set `origin` to `true` to reflect the [request origin](http://tools.ietf.org/html/draft-abarth-origin-09), as defined by `req.header('Origin')`, or set it to `false` to disable CORS.
  - `String` - set `origin` to a specific origin. For example if you set it to `"http://example.com"` only requests from "http://example.com" will be allowed.
  - `RegExp` - set `origin` to a regular expression pattern which will be used to test the request origin. If it's a match, the request origin will be reflected. For example the pattern `/example\.com$/` will reflect any request that is coming from an origin ending with "example.com".
  - `Array` - set `origin` to an array of valid origins. Each origin can be a `String` or a `RegExp`. For example `["http://example1.com", /\.example2\.com$/]` will accept any request from "http://example1.com" or from a subdomain of "example2.com".
  - `Function` - set `origin` to a function implementing some custom logic. The function takes the request origin as the first parameter and a callback (called as `callback(err, origin)`, where `origin` is a non-function value of the `origin` option) as the second.
* `methods`: Configures the **Access-Control-Allow-Methods** CORS header. Expects a comma-delimited string (ex: 'GET,PUT,POST') or an array (ex: `['GET', 'PUT', 'POST']`).
* `allowedHeaders`: Configures the **Access-Control-Allow-Headers** CORS header. Expects a comma-delimited string (ex: 'Content-Type,Authorization') or an array (ex: `['Content-Type', 'Authorization']`). If not specified, defaults to reflecting the headers specified in the request's **Access-Control-Request-Headers** header.
* `exposedHeaders`: Configures the **Access-Control-Expose-Headers** CORS header. Expects a comma-delimited string (ex: 'Content-Range,X-Content-Range') or an array (ex: `['Content-Range', 'X-Content-Range']`). If not specified, no custom headers are exposed.
* `credentials`: Configures the **Access-Control-Allow-Credentials** CORS header. Set to `true` to pass the header, otherwise it is omitted.
* `maxAge`: Configures the **Access-Control-Max-Age** CORS header. Set to an integer to pass the header, otherwise it is omitted.
* `preflightContinue`: Pass the CORS preflight response to the next handler.
* `optionsSuccessStatus`: Provides a status code to use for successful `OPTIONS` requests, since some legacy browsers (IE11, various SmartTVs) choke on `204`.

The default configuration is the equivalent of:

```json
{
  "origin": "*",
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  "preflightContinue": false,
  "optionsSuccessStatus": 204
}
```

For details on the effect of each CORS header, read [this](https://web.dev/cross-origin-resource-sharing/) article on web.dev.

## Demo

A demo that illustrates CORS working (and not working) using React is available here: [https://node-cors-client.netlify.com](https://node-cors-client.netlify.com)

Code for that demo can be found here:

* Client: [https://github.com/troygoode/node-cors-client](https://github.com/troygoode/node-cors-client)
* Server: [https://github.com/troygoode/node-cors-server](https://github.com/troygoode/node-cors-server)

## License

[MIT License](http://www.opensource.org/licenses/mit-license.php)

## Author

[Troy Goode](https://github.com/TroyGoode) ([troygoode@gmail.com](mailto:troygoode@gmail.com))

[coveralls-image]: https://img.shields.io/coveralls/expressjs/cors/master.svg
[coveralls-url]: https://coveralls.io/r/expressjs/cors?branch=master
[downloads-image]: https://img.shields.io/npm/dm/cors.svg
[downloads-url]: https://npmjs.org/package/cors
[github-actions-ci-image]: https://img.shields.io/github/actions/workflow/status/expressjs/cors/ci.yml?branch=master&label=ci
[github-actions-ci-url]: https://github.com/expressjs/cors?query=workflow%3Aci
[npm-image]: https://img.shields.io/npm/v/cors.svg
[npm-url]: https://npmjs.org/package/cors
