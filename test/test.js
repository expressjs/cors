(function () {

  'use strict';

  var after = require('after')
  var assert = require('assert')
  var cors = require('..')

  var fakeRequest = function (method, headers) {
      return {
        method: method,
        headers: headers || {
          'origin': 'request.com',
          'access-control-request-headers': 'requestedHeader1,requestedHeader2'
        },
        pause: function () {
          // do nothing
          return;
        },
        resume: function () {
          // do nothing
          return;
        }
      };
    },
    fakeResponse = function () {
      var headers = {};
      return {
        allHeaders: function () {
          return headers;
        },
        getHeader: function (key) {
          return headers[key];
        },
        setHeader: function (key, value) {
          headers[key] = value;
          return;
        },
        get: function (key) {
          return headers[key];
        }
      };
    };

  describe('cors', function () {
    it('does not alter `options` configuration object', function () {
      var options = Object.freeze({
        origin: 'custom-origin'
      });
      assert.doesNotThrow(function () {
        cors(options);
      })
    });

    it('passes control to next middleware', function (done) {
      // arrange
      var req, res, next;
      req = fakeRequest('GET');
      res = fakeResponse();
      next = function () {
        done();
      };

      // act
      cors()(req, res, next);
    });

    it('shortcircuits preflight requests', function (done) {
      // arrange
      var cb = after(1, done)
      var req, res, next;
      req = fakeRequest('OPTIONS');
      res = fakeResponse();
      res.end = function () {
        // assert
        assert.equal(res.statusCode, 204)
        cb()
      };
      next = function () {
        // assert
        cb(new Error('should not be called'))
      };

      // act
      cors()(req, res, next);
    });

    it('can configure preflight success response status code', function (done) {
      // arrange
      var cb = after(1, done)
      var req, res, next;
      req = fakeRequest('OPTIONS');
      res = fakeResponse();
      res.end = function () {
        // assert
        assert.equal(res.statusCode, 200)
        cb()
      };
      next = function () {
        // assert
        cb(new Error('should not be called'))
      };

      // act
      cors({optionsSuccessStatus: 200})(req, res, next);
    });

    it('doesn\'t shortcircuit preflight requests with preflightContinue option', function (done) {
      // arrange
      var cb = after(1, done)
      var req, res, next;
      req = fakeRequest('OPTIONS');
      res = fakeResponse();
      res.end = function () {
        // assert
        cb(new Error('should not be called'))
      };
      next = function () {
        // assert
        cb()
      };

      // act
      cors({preflightContinue: true})(req, res, next);
    });

    it('normalizes method names', function (done) {
      // arrange
      var cb = after(1, done)
      var req, res, next;
      req = fakeRequest('options');
      res = fakeResponse();
      res.end = function () {
        // assert
        assert.equal(res.statusCode, 204)
        cb()
      };
      next = function () {
        // assert
        cb(new Error('should not be called'))
      };

      // act
      cors()(req, res, next);
    });

    it('includes Content-Length response header', function (done) {
      // arrange
      var cb = after(1, done)
      var req, res, next;
      req = fakeRequest('OPTIONS');
      res = fakeResponse();
      res.end = function () {
        // assert
        assert.equal(res.getHeader('Content-Length'), '0')
        cb()
      };
      next = function () {
        // assert
        cb(new Error('should not be called'))
      };

      // act
      cors()(req, res, next);
    });

    it('no options enables default CORS to all origins', function (done) {
      // arrange
      var req, res, next;
      req = fakeRequest('GET');
      res = fakeResponse();
      next = function () {
        // assert
        assert.equal(res.getHeader('Access-Control-Allow-Origin'), '*')
        assert.equal(res.getHeader('Access-Control-Allow-Methods'), undefined)
        done();
      };

      // act
      cors()(req, res, next);
    });

    it('OPTION call with no options enables default CORS to all origins and methods', function (done) {
      // arrange
      var cb = after(1, done)
      var req, res, next;
      req = fakeRequest('OPTIONS');
      res = fakeResponse();
      res.end = function () {
        // assert
        assert.equal(res.statusCode, 204)
        assert.equal(res.getHeader('Access-Control-Allow-Origin'), '*')
        assert.equal(res.getHeader('Access-Control-Allow-Methods'), 'GET,HEAD,PUT,PATCH,POST,DELETE')
        cb()
      };
      next = function () {
        // assert
        cb(new Error('should not be called'))
      };

      // act
      cors()(req, res, next);
    });

    describe('passing static options', function () {
      it('overrides defaults', function (done) {
        // arrange
        var cb = after(1, done)
        var req, res, next, options;
        options = {
          origin: 'example.com',
          methods: ['FOO', 'bar'],
          headers: ['FIZZ', 'buzz'],
          credentials: true,
          maxAge: 123
        };
        req = fakeRequest('OPTIONS');
        res = fakeResponse();
        res.end = function () {
          // assert
          assert.equal(res.statusCode, 204)
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), 'example.com')
          assert.equal(res.getHeader('Access-Control-Allow-Methods'), 'FOO,bar')
          assert.equal(res.getHeader('Access-Control-Allow-Headers'), 'FIZZ,buzz')
          assert.equal(res.getHeader('Access-Control-Allow-Credentials'), 'true')
          assert.equal(res.getHeader('Access-Control-Max-Age'), '123')
          cb()
        };
        next = function () {
          // assert
          cb(new Error('should not be called'))
        };

        // act
        cors(options)(req, res, next);
      });

      it('matches request origin against regexp', function(done) {
        var req = fakeRequest('GET');
        var res = fakeResponse();
        var options = { origin: /^(.+\.)?request.com$/ };
        cors(options)(req, res, function(err) {
          assert.ifError(err)
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), req.headers.origin)
          assert.equal(res.getHeader('Vary'), 'Origin')
          return done();
        });
      });

      it('matches request origin against array of origin checks', function(done) {
        var req = fakeRequest('GET');
        var res = fakeResponse();
        var options = { origin: [ /foo\.com$/, 'request.com' ] };
        cors(options)(req, res, function(err) {
          assert.ifError(err)
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), req.headers.origin)
          assert.equal(res.getHeader('Vary'), 'Origin')
          return done();
        });
      });

      it('doesn\'t match request origin against array of invalid origin checks', function(done) {
        var req = fakeRequest('GET');
        var res = fakeResponse();
        var options = { origin: [ /foo\.com$/, 'bar.com' ] };
        cors(options)(req, res, function(err) {
          assert.ifError(err)
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), undefined)
          assert.equal(res.getHeader('Vary'), 'Origin')
          return done();
        });
      });

      it('origin of false disables cors', function (done) {
        // arrange
        var req, res, next, options;
        options = {
          origin: false,
          methods: ['FOO', 'bar'],
          headers: ['FIZZ', 'buzz'],
          credentials: true,
          maxAge: 123
        };
        req = fakeRequest('GET');
        res = fakeResponse();
        next = function () {
          // assert
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), undefined)
          assert.equal(res.getHeader('Access-Control-Allow-Methods'), undefined)
          assert.equal(res.getHeader('Access-Control-Allow-Headers'), undefined)
          assert.equal(res.getHeader('Access-Control-Allow-Credentials'), undefined)
          assert.equal(res.getHeader('Access-Control-Max-Age'), undefined)
          done();
        };

        // act
        cors(options)(req, res, next);
      });

      it('can override origin', function (done) {
        // arrange
        var req, res, next, options;
        options = {
          origin: 'example.com'
        };
        req = fakeRequest('GET');
        res = fakeResponse();
        next = function () {
          // assert
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), 'example.com')
          done();
        };

        // act
        cors(options)(req, res, next);
      });

      it('includes Vary header for specific origins', function (done) {
        // arrange
        var req, res, next, options;
        options = {
          origin: 'example.com'
        };
        req = fakeRequest('GET');
        res = fakeResponse();
        next = function () {
          // assert
          assert.equal(res.getHeader('Vary'), 'Origin')
          done();
        };

        // act
        cors(options)(req, res, next);
      });

      it('appends to an existing Vary header', function (done) {
        // arrange
        var req, res, next, options;
        options = {
          origin: 'example.com'
        };
        req = fakeRequest('GET');
        res = fakeResponse();
        res.setHeader('Vary', 'Foo');
        next = function () {
          // assert
          assert.equal(res.getHeader('Vary'), 'Foo, Origin')
          done();
        };

        // act
        cors(options)(req, res, next);
      });

      it('origin defaults to *', function (done) {
        // arrange
        var req, res, next;
        req = fakeRequest('GET');
        res = fakeResponse();
        next = function () {
          // assert
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), '*')
          done();
        };

        // act
        cors()(req, res, next);
      });

      it('specifying true for origin reflects requesting origin', function (done) {
        // arrange
        var req, res, next, options;
        options = {
          origin: true
        };
        req = fakeRequest('GET');
        res = fakeResponse();
        next = function () {
          // assert
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), 'request.com')
          done();
        };

        // act
        cors(options)(req, res, next);
      });

      it('should allow origin when callback returns true', function (done) {
        var req, res, next, options;
        options = {
          origin: function (sentOrigin, cb) {
            assert.equal(sentOrigin, 'request.com')
            cb(null, true);
          }
        };
        req = fakeRequest('GET');
        res = fakeResponse();
        next = function () {
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), 'request.com')
          done();
        };

        cors(options)(req, res, next);
      });

      it('should not allow origin when callback returns false', function (done) {
        var req, res, next, options;
        options = {
          origin: function (sentOrigin, cb) {
            assert.equal(sentOrigin, 'request.com')
            cb(null, false);
          }
        };
        req = fakeRequest('GET');
        res = fakeResponse();
        next = function () {
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), undefined)
          assert.equal(res.getHeader('Access-Control-Allow-Methods'), undefined)
          assert.equal(res.getHeader('Access-Control-Allow-Headers'), undefined)
          assert.equal(res.getHeader('Access-Control-Allow-Credentials'), undefined)
          assert.equal(res.getHeader('Access-Control-Max-Age'), undefined)
          done();
        };

        cors(options)(req, res, next);
      });

      it('should not override options.origin callback', function (done) {
        var req, res, next, options;
        options = {
          origin: function (sentOrigin, cb) {
            var isValid = sentOrigin === 'request.com';
            cb(null, isValid);
          }
        };

        req = fakeRequest('GET');
        res = fakeResponse();
        next = function () {
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), 'request.com')
        };

        cors(options)(req, res, next);

        req = fakeRequest('GET', {
          'origin': 'invalid-request.com'
        });
        res = fakeResponse();

        next = function () {
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), undefined)
          assert.equal(res.getHeader('Access-Control-Allow-Methods'), undefined)
          assert.equal(res.getHeader('Access-Control-Allow-Headers'), undefined)
          assert.equal(res.getHeader('Access-Control-Allow-Credentials'), undefined)
          assert.equal(res.getHeader('Access-Control-Max-Age'), undefined)
          done();
        };

        cors(options)(req, res, next);
      });


      it('can override methods', function (done) {
        // arrange
        var cb = after(1, done)
        var req, res, next, options;
        options = {
          methods: ['method1', 'method2']
        };
        req = fakeRequest('OPTIONS');
        res = fakeResponse();
        res.end = function () {
          // assert
          assert.equal(res.statusCode, 204)
          assert.equal(res.getHeader('Access-Control-Allow-Methods'), 'method1,method2')
          cb()
        };
        next = function () {
          // assert
          cb(new Error('should not be called'))
        };

        // act
        cors(options)(req, res, next);
      });

      it('methods defaults to GET, HEAD, PUT, PATCH, POST, DELETE', function (done) {
        // arrange
        var cb = after(1, done)
        var req, res, next;
        req = fakeRequest('OPTIONS');
        res = fakeResponse();
        res.end = function () {
          // assert
          assert.equal(res.statusCode, 204)
          assert.equal(res.getHeader('Access-Control-Allow-Methods'), 'GET,HEAD,PUT,PATCH,POST,DELETE')
          cb()
        };
        next = function () {
          // assert
          cb(new Error('should not be called'))
        };

        // act
        cors()(req, res, next);
      });

      it('can specify allowed headers as array', function (done) {
        // arrange
        var req, res, options;
        options = {
          allowedHeaders: ['header1', 'header2']
        };
        req = fakeRequest('OPTIONS');
        res = fakeResponse();
        res.end = function () {
          // assert
          assert.equal(res.getHeader('Access-Control-Allow-Headers'), 'header1,header2')
          assert.equal(res.getHeader('Vary'), undefined)
          done();
        };

        // act
        cors(options)(req, res, null);
      });

      it('can specify allowed headers as string', function (done) {
        // arrange
        var req, res, options;
        options = {
          allowedHeaders: 'header1,header2'
        };
        req = fakeRequest('OPTIONS');
        res = fakeResponse();
        res.end = function () {
          // assert
          assert.equal(res.getHeader('Access-Control-Allow-Headers'), 'header1,header2')
          assert.equal(res.getHeader('Vary'), undefined)
          done();
        };

        // act
        cors(options)(req, res, null);
      });

      it('specifying an empty list or string of allowed headers will result in no response header for allowed headers', function (done) {
        // arrange
        var req, res, next, options;
        options = {
          allowedHeaders: []
        };
        req = fakeRequest('GET');
        res = fakeResponse();
        next = function () {
          // assert
          assert.equal(res.getHeader('Access-Control-Allow-Headers'), undefined)
          assert.equal(res.getHeader('Vary'), undefined)
          done();
        };

        // act
        cors(options)(req, res, next);
      });

      it('if no allowed headers are specified, defaults to requested allowed headers', function (done) {
        // arrange
        var req, res;
        req = fakeRequest('OPTIONS');
        res = fakeResponse();
        res.end = function () {
          // assert
          assert.equal(res.getHeader('Access-Control-Allow-Headers'), 'requestedHeader1,requestedHeader2')
          assert.equal(res.getHeader('Vary'), 'Access-Control-Request-Headers')
          done();
        };

        // act
        cors()(req, res, null);
      });

      it('can specify exposed headers as array', function (done) {
        // arrange
        var req, res, options, next;
        options = {
          exposedHeaders: ['custom-header1', 'custom-header2']
        };
        req = fakeRequest('GET');
        res = fakeResponse();
        next = function () {
          // assert
          assert.equal(res.getHeader('Access-Control-Expose-Headers'), 'custom-header1,custom-header2')
          done();
        };

        // act
        cors(options)(req, res, next);
      });

      it('can specify exposed headers as string', function (done) {
        // arrange
        var req, res, options, next;
        options = {
          exposedHeaders: 'custom-header1,custom-header2'
        };
        req = fakeRequest('GET');
        res = fakeResponse();
        next = function () {
          // assert
          assert.equal(res.getHeader('Access-Control-Expose-Headers'), 'custom-header1,custom-header2')
          done();
        };

        // act
        cors(options)(req, res, next);
      });

      it('specifying an empty list or string of exposed headers will result in no response header for exposed headers', function (done) {
        // arrange
        var req, res, next, options;
        options = {
          exposedHeaders: []
        };
        req = fakeRequest('GET');
        res = fakeResponse();
        next = function () {
          // assert
          assert.equal(res.getHeader('Access-Control-Expose-Headers'), undefined)
          done();
        };

        // act
        cors(options)(req, res, next);
      });

      it('includes credentials if explicitly enabled', function (done) {
        // arrange
        var req, res, options;
        options = {
          credentials: true
        };
        req = fakeRequest('OPTIONS');
        res = fakeResponse();
        res.end = function () {
          // assert
          assert.equal(res.getHeader('Access-Control-Allow-Credentials'), 'true')
          done();
        };

        // act
        cors(options)(req, res, null);
      });

      it('does not includes credentials unless explicitly enabled', function (done) {
        // arrange
        var req, res, next;
        req = fakeRequest('GET');
        res = fakeResponse();
        next = function () {
          // assert
          assert.equal(res.getHeader('Access-Control-Allow-Credentials'), undefined)
          done();
        };

        // act
        cors()(req, res, next);
      });

      it('includes maxAge when specified', function (done) {
        // arrange
        var req, res, options;
        options = {
          maxAge: 456
        };
        req = fakeRequest('OPTIONS');
        res = fakeResponse();
        res.end = function () {
          // assert
          assert.equal(res.getHeader('Access-Control-Max-Age'), '456')
          done();
        };

        // act
        cors(options)(req, res, null);
      });

      it('does not includes maxAge unless specified', function (done) {
        // arrange
        var req, res, next;
        req = fakeRequest('GET');
        res = fakeResponse();
        next = function () {
          // assert
          assert.equal(res.getHeader('Access-Control-Max-Age'), undefined)
          done();
        };

        // act
        cors()(req, res, next);
      });
    });

    describe('passing a function to build options', function () {
      it('handles options specified via callback', function (done) {
        // arrange
        var req, res, next, delegate;
        delegate = function (req2, cb) {
          cb(null, {
            origin: 'delegate.com'
          });
        };
        req = fakeRequest('GET');
        res = fakeResponse();
        next = function () {
          // assert
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), 'delegate.com')
          done();
        };

        // act
        cors(delegate)(req, res, next);
      });

      it('handles options specified via callback for preflight', function (done) {
        // arrange
        var req, res, delegate;
        delegate = function (req2, cb) {
          cb(null, {
            origin: 'delegate.com',
            maxAge: 1000
          });
        };
        req = fakeRequest('OPTIONS');
        res = fakeResponse();
        res.end = function () {
          // assert
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), 'delegate.com')
          assert.equal(res.getHeader('Access-Control-Max-Age'), '1000')
          done();
        };

        // act
        cors(delegate)(req, res, null);
      });

      it('handles error specified via callback', function (done) {
        // arrange
        var req, res, next, delegate;
        delegate = function (req2, cb) {
          cb('some error');
        };
        req = fakeRequest('GET');
        res = fakeResponse();
        next = function (err) {
          // assert
          assert.equal(err, 'some error')
          done();
        };

        // act
        cors(delegate)(req, res, next);
      });
    });
  });

}());
