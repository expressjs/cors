# cors

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][github-actions-ci-image]][github-actions-ci-url]
[![Test Coverage][coveralls-image]][coveralls-url]

CORS is a [Node.js](https://nodejs.org/en/) package for providing a [Connect](https://github.com/senchalabs/connect)/[Express](https://expressjs.com/) middleware that can be used to enable [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) with various options.

* [Installation](#installation)
* [Usage](#usage)
  * [Simple Usage (Allow All Origins)](#simple-usage-allow-all-origins)
  * [Add CORS Headers to a Single Route](#add-cors-headers-to-a-single-route)
  * [Configuring CORS](#configuring-cors)
  * [Configuring CORS w/ Dynamic Origin](#configuring-cors-w-dynamic-origin)
  * [Enabling CORS Pre-Flight](#enabling-cors-pre-flight)
  * [Customizing CORS Settings Dynamically per Request](#customizing-cors-settings-dynamically-per-request)
* [Configuration Options](#configuration-options)
* [License](#license)
* [Original Author](#original-author)

## Installation

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/). Installation is done using the
[`npm install` command](https://docs.npmjs.com/downloading-and-installing-packages-locally):

```sh
$ npm install cors
```

## Usage

### Simple Usage (Allow All Origins)

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

### Add CORS Headers to a Single Route

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

See the [configuration options](#configuration-options) for details.

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

You can determine the origin dynamically by passing a function to the `origin` option. The function receives the request origin (or `undefined` if none) and a callback: `callback(error, origin)`.

This is useful for loading allowed origins from a database.

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

Requests that aren't [simple requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS#simple_requests) trigger a browser "preflight"—an OPTIONS request sent before the actual request.

**If you use `app.use(cors())`**, preflight is handled automatically for all routes.

**If you use route-level middleware** like `app.get('/path', cors(), ...)`, you need to add an OPTIONS handler because Express only routes the specific method to your handler:

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

You can also enable preflight across-the-board:

```javascript
app.options('*', cors()) // include before other routes
```

### Customizing CORS Settings Dynamically per Request

To vary CORS settings per request, pass a function instead of an options object. The function receives `(req, callback)` and calls `callback(null, corsOptions)`.

```javascript
var dynamicCorsOptions = function(req, callback) {
  var corsOptions;
  if (req.path.startsWith('/auth/connect/')) {
    corsOptions = {
      origin: 'http://mydomain.com', // Allow only a specific origin
      credentials: true,            // Enable cookies and credentials
    };
  } else {
    corsOptions = { origin: '*' };   // Allow all origins for other routes
  }
  callback(null, corsOptions);
};

app.use(cors(dynamicCorsOptions));

app.get('/auth/connect/twitter', function (req, res) {
  res.send('CORS dynamically applied for Twitter authentication.');
});

app.get('/public', function (req, res) {
  res.send('Public data with open CORS.');
});

app.listen(80, function () {
  console.log('CORS-enabled web server listening on port 80')
})
```

## Configuration Options

* `origin`: Configures the **Access-Control-Allow-Origin** CORS header. Possible values:
  - `Boolean` - `true` sets the header to the request's origin (`req.header('Origin')`). `false` disables CORS (no header sent).
  - `String` - sets the header to this exact value. For example:
    - `"http://example.com"` - header is always `Access-Control-Allow-Origin: http://example.com`
    - `"*"` - header is always `Access-Control-Allow-Origin: *`
  - `RegExp` - if the request origin matches, the header is set to that origin. For example `/example\.com$/` matches any origin ending with "example.com".
  - `Array` - array of valid origins (strings or RegExps). If the request origin matches any, the header is set to that origin. For example `["http://example1.com", /\.example2\.com$/]`.
  - `Function` - custom logic. Receives `(origin, callback)` and calls `callback(err, origin)` where `origin` is any non-function value above.
* `methods`: Configures the **Access-Control-Allow-Methods** CORS header. Expects a comma-delimited string (ex: 'GET,PUT,POST') or an array (ex: `['GET', 'PUT', 'POST']`).
* `allowedHeaders`: Configures the **Access-Control-Allow-Headers** CORS header. Expects a comma-delimited string (ex: 'Content-Type,Authorization') or an array (ex: `['Content-Type', 'Authorization']`). If not specified, mirrors the request's **Access-Control-Request-Headers** header.
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

For details on the effect of each CORS header, read [this](https://web.dev/articles/cross-origin-resource-sharing) article.

## License

[MIT License](http://www.opensource.org/licenses/mit-license.php)

## Original Author

[Troy Goode](https://github.com/TroyGoode) ([troygoode@gmail.com](mailto:troygoode@gmail.com))

[coveralls-image]: https://img.shields.io/coveralls/expressjs/cors/master.svg
[coveralls-url]: https://coveralls.io/r/expressjs/cors?branch=master
[downloads-image]: https://img.shields.io/npm/dm/cors.svg
[downloads-url]: https://npmjs.com/package/cors
[github-actions-ci-image]: https://img.shields.io/github/actions/workflow/status/expressjs/cors/ci.yml?branch=master&label=ci
[github-actions-ci-url]: https://github.com/expressjs/cors?query=workflow%3Aci
[npm-image]: https://img.shields.io/npm/v/cors.svg
[npm-url]: https://npmjs.com/package/cors
