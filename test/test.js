'use strict';

const EventEmitter = require('events').EventEmitter;
const util = require('util');

(function () {
  'use strict';

  const after = require('after');
  const assert = require('assert');
  const cors = require('..');

  const fakeRequest = function (method, headers) {
    return new FakeRequest(method, headers);
  };

  const fakeResponse = function () {
    return new FakeResponse();
  };

  describe('cors', function () {
    it('does not alter `options` configuration object', function () {
      const options = Object.freeze({
        origin: 'custom-origin'
      });
      assert.doesNotThrow(function () {
        cors(options);
      });
    });

    it('passes control to next middleware', function (done) {
      // arrange
      const req = fakeRequest('GET');
      const res = fakeResponse();
      const next = function () {
        done();
      };

      // act
      cors()(req, res, next);
    });

    it('shortcircuits preflight requests', function (done) {
      const cb = after(1, done);
      const req = new FakeRequest('OPTIONS');
      const res = new FakeResponse();

      res.on('finish', function () {
        assert.equal(res.statusCode, 204);
        cb();
      });

      cors()(req, res, function (err) {
        cb(err || new Error('should not be called'));
      });
    });

    it('can configure preflight success response status code', function (done) {
      const cb = after(1, done);
      const req = new FakeRequest('OPTIONS');
      const res = new FakeResponse();

      res.on('finish', function () {
        assert.equal(res.statusCode, 200);
        cb();
      });

      // act
      cors({ optionsSuccessStatus: 200 })(req, res, function (err) {
        cb(err || new Error('should not be called'));
      });
    });

    it('doesn\'t shortcircuit preflight requests with preflightContinue option', function (done) {
      const cb = after(1, done);
      const req = new FakeRequest('OPTIONS');
      const res = new FakeResponse();

      res.on('finish', function () {
        cb(new Error('should not be called'));
      });

      cors({ preflightContinue: true })(req, res, function (err) {
        if (err) return cb(err);
        setTimeout(cb, 10);
      });
    });

    it('normalizes method names', function (done) {
      const cb = after(1, done);
      const req = new FakeRequest('options');
      const res = new FakeResponse();

      res.on('finish', function () {
        assert.equal(res.statusCode, 204);
        cb();
      });

      cors()(req, res, function (err) {
        cb(err || new Error('should not be called'));
      });
    });

    it('includes Content-Length response header', function (done) {
      const cb = after(1, done);
      const req = new FakeRequest('OPTIONS');
      const res = new FakeResponse();

      res.on('finish', function () {
        assert.equal(res.getHeader('Content-Length'), '0');
        cb();
      });

      cors()(req, res, function (err) {
        cb(err || new Error('should not be called'));
      });
    });

    it('no options enables default CORS to all origins', function (done) {
      // arrange
      const req = fakeRequest('GET');
      const res = fakeResponse();
      const next = function () {
        // assert
        assert.equal(res.getHeader('Access-Control-Allow-Origin'), '*')
        assert.equal(res.getHeader('Access-Control-Allow-Methods'), undefined)
        done();
      };

      // act
      cors()(req, res, next)
    });

    it('OPTION call with no options enables default CORS to all origins and methods', function (done) {
      const cb = after(1, done)
      const req = new FakeRequest('OPTIONS')
      const res = new FakeResponse()

      res.on('finish', function () {
        assert.equal(res.statusCode, 204)
        assert.equal(res.getHeader('Access-Control-Allow-Origin'), '*')
        assert.equal(res.getHeader('Access-Control-Allow-Methods'), 'GET,HEAD,PUT,PATCH,POST,DELETE')
        cb()
      })

      cors()(req, res, function (err) {
        cb(err || new Error('should not be called'))
      })
    });

    describe('passing static options', function () {
      it('overrides defaults', function (done) {
        const cb = after(1, done)
        const req = new FakeRequest('OPTIONS')
        const res = new FakeResponse()
        const options = {
          origin: 'http://example.com',
          methods: ['FOO', 'bar'],
          headers: ['FIZZ', 'buzz'],
          credentials: true,
          maxAge: 123
        };

        res.on('finish', function () {
          assert.equal(res.statusCode, 204)
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), 'http://example.com')
          assert.equal(res.getHeader('Access-Control-Allow-Methods'), 'FOO,bar')
          assert.equal(res.getHeader('Access-Control-Allow-Headers'), 'FIZZ,buzz')
          assert.equal(res.getHeader('Access-Control-Allow-Credentials'), 'true');
          assert.equal(res.getHeader('Access-Control-Max-Age'), '123');
          cb()
        })

        cors(options)(req, res, function (err) {
          cb(err || new Error('should not be called'));
        });
      });

      it('matches request origin against regexp', function (done) {
        const req = fakeRequest('GET');
        const res = fakeResponse();
        const options = { origin: /:\/\/(.+\.)?example.com$/ };
        cors(options)(req, res, function (err) {
          assert.ifError(err);
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), req.headers.origin);
          assert.equal(res.getHeader('Vary'), 'Origin');
          return done();
        });
      });

      it('matches request origin against array of origin checks', function (done) {
        const req = fakeRequest('GET');
        const res = fakeResponse();
        const options = { origin: [/foo\.com$/, 'http://example.com'] };
        cors(options)(req, res, function (err) {
          assert.ifError(err);
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), req.headers.origin);
          assert.equal(res.getHeader('Vary'), 'Origin');
          return done();
        });
      });

      it('doesn\'t match request origin against array of invalid origin checks', function (done) {
        const req = fakeRequest('GET');
        const res = fakeResponse();
        const options = { origin: [/foo\.com$/, 'bar.com'] };
        cors(options)(req, res, function (err) {
          assert.ifError(err);
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), undefined);
          assert.equal(res.getHeader('Vary'), 'Origin');
          return done();
        });
      });

      it('origin of false disables cors', function (done) {
        const options = {
          origin: false,
          methods: ['FOO', 'bar'],
          headers: ['FIZZ', 'buzz'],
          credentials: true,
          maxAge: 123
        };
        const req = fakeRequest('GET');
        const res = fakeResponse();
        const next = function () {
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), undefined);
          assert.equal(res.getHeader('Access-Control-Allow-Methods'), undefined);
          assert.equal(res.getHeader('Access-Control-Allow-Headers'), undefined);
          assert.equal(res.getHeader('Access-Control-Allow-Credentials'), undefined);
          assert.equal(res.getHeader('Access-Control-Max-Age'), undefined);
          done();
        };

        cors(options)(req, res, next);
      });

      it('can override origin', function (done) {
        const options = {
          origin: 'http://example.com'
        };
        const req = fakeRequest('GET');
        const res = fakeResponse();
        const next = function () {
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), 'http://example.com');
          done();
        };

        cors(options)(req, res, next);
      });

      it('includes Vary header for specific origins', function (done) {
        const options = {
          origin: 'http://example.com'
        };
        const req = fakeRequest('GET');
        const res = fakeResponse();
        const next = function () {
          assert.equal(res.getHeader('Vary'), 'Origin');
          done();
        };

        cors(options)(req, res, next);
      });

      it('appends to an existing Vary header', function (done) {
        const options = {
          origin: 'http://example.com'
        };
        const req = fakeRequest('GET');
        const res = fakeResponse();
        res.setHeader('Vary', 'Foo');
        const next = function () {
          assert.equal(res.getHeader('Vary'), 'Foo, Origin');
          done();
        };

        cors(options)(req, res, next);
      });

      it('origin defaults to *', function (done) {
        const req = fakeRequest('GET');
        const res = fakeResponse();
        const next = function () {
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), '*');
          done();
        };

        cors()(req, res, next);
      });

      it('specifying true for origin reflects requesting origin', function (done) {
        const options = {
          origin: true
        };
        const req = fakeRequest('GET');
        const res = fakeResponse();
        const next = function () {
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), 'http://example.com');
          done();
        };

        cors(options)(req, res, next);
      });

      it('should allow origin when callback returns true', function (done) {
        const options = {
          origin: function (sentOrigin, cb) {
            cb(null, true);
          }
        };
        const req = fakeRequest('GET');
        const res = fakeResponse();
        const next = function () {
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), 'http://example.com');
          done();
        };

        cors(options)(req, res, next);
      });

      it('should not allow origin when callback returns false', function (done) {
        const options = {
          origin: function (sentOrigin, cb) {
            cb(null, false);
          }
        };
        const req = fakeRequest('GET');
        const res = fakeResponse();
        const next = function () {
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), undefined);
          assert.equal(res.getHeader('Access-Control-Allow-Methods'), undefined);
          assert.equal(res.getHeader('Access-Control-Allow-Headers'), undefined);
          assert.equal(res.getHeader('Access-Control-Allow-Credentials'), undefined);
          assert.equal(res.getHeader('Access-Control-Max-Age'), undefined);
          done();
        };

        cors(options)(req, res, next);
      });

      it('should not override options.origin callback', function (done) {
        const options = {
          origin: function (sentOrigin, cb) {
            cb(null, sentOrigin === 'http://example.com');
          }
        };

        let req = fakeRequest('GET');
        let res = fakeResponse();
        let next = function () {
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), 'http://example.com');
        };

        cors(options)(req, res, next);

        req = fakeRequest('GET', {
          'origin': 'http://localhost'
        });
        res = fakeResponse();

        next = function () {
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), undefined);
          assert.equal(res.getHeader('Access-Control-Allow-Methods'), undefined);
          assert.equal(res.getHeader('Access-Control-Allow-Headers'), undefined);
          assert.equal(res.getHeader('Access-Control-Allow-Credentials'), undefined);
          assert.equal(res.getHeader('Access-Control-Max-Age'), undefined);
          done();
        };

        cors(options)(req, res, next);
      });

      it('can override methods', function (done) {
        const cb = after(1, done);
        const req = new FakeRequest('OPTIONS');
        const res = new FakeResponse();
        const options = {
          methods: ['method1', 'method2']
        };

        res.on('finish', function () {
          assert.equal(res.statusCode, 204);
          assert.equal(res.getHeader('Access-Control-Allow-Methods'), 'method1,method2');
          cb();
        });

        cors(options)(req, res, function (err) {
          cb(err || new Error('should not be called'));
        });
      });

      it('methods defaults to GET, HEAD, PUT, PATCH, POST, DELETE', function (done) {
        const cb = after(1, done);
        const req = new FakeRequest('OPTIONS');
        const res = new FakeResponse();

        res.on('finish', function () {
          assert.equal(res.statusCode, 204);
          assert.equal(res.getHeader('Access-Control-Allow-Methods'), 'GET,HEAD,PUT,PATCH,POST,DELETE');
          cb();
        });

        cors()(req, res, function (err) {
          cb(err || new Error('should not be called'));
        });
      });

      it('can specify allowed headers as array', function (done) {
        const cb = after(1, done);
        const req = new FakeRequest('OPTIONS');
        const res = new FakeResponse();

        res.on('finish', function () {
          assert.strictEqual(res.getHeader('Access-Control-Allow-Headers'), 'header1,header2');
          assert.equal(res.getHeader('Vary'), undefined);
          cb();
        });

        cors({ allowedHeaders: ['header1', 'header2'] })(req, res, function (err) {
          cb(err || new Error('should not be called'));
        });
      });

      it('can specify allowed headers as string', function (done) {
        const cb = after(1, done);
        const req = new FakeRequest('OPTIONS');
        const res = new FakeResponse();

        res.on('finish', function () {
          assert.equal(res.getHeader('Access-Control-Allow-Headers'), 'header1,header2');
          assert.equal(res.getHeader('Vary'), undefined);
          cb();
        });

        cors({ allowedHeaders: 'header1,header2' })(req, res, function (err) {
          cb(err || new Error('should not be called'));
        });
      });

      it('specifying an empty list or string of allowed headers will result in no response header for allowed headers', function (done) {
        const options = {
          allowedHeaders: []
        };
        const req = fakeRequest('GET');
        const res = fakeResponse();
        const next = function () {
          assert.equal(res.getHeader('Access-Control-Allow-Headers'), undefined);
          assert.equal(res.getHeader('Vary'), undefined);
          done();
        };

        cors(options)(req, res, next);
      });

      it('if no allowed headers are specified, defaults to requested allowed headers', function (done) {
        const cb = after(1, done);
        const req = new FakeRequest('OPTIONS');
        const res = new FakeResponse();

        res.on('finish', function () {
          assert.equal(res.getHeader('Access-Control-Allow-Headers'), 'x-header-1, x-header-2');
          assert.equal(res.getHeader('Vary'), 'Access-Control-Request-Headers');
          cb();
        });

        cors()(req, res, function (err) {
          cb(err || new Error('should not be called'));
        });
      });

      it('can specify exposed headers as array', function (done) {
        const options = {
          exposedHeaders: ['custom-header1', 'custom-header2']
        };
        const req = fakeRequest('GET');
        const res = fakeResponse();
        const next = function () {
          assert.equal(res.getHeader('Access-Control-Expose-Headers'), 'custom-header1,custom-header2');
          done();
        };

        cors(options)(req, res, next);
      });

      it('can specify exposed headers as string', function (done) {
        const options = {
          exposedHeaders: 'custom-header1,custom-header2'
        };
        const req = fakeRequest('GET');
        const res = fakeResponse();
        const next = function () {
          assert.equal(res.getHeader('Access-Control-Expose-Headers'), 'custom-header1,custom-header2');
          done();
        };

        cors(options)(req, res, next);
      });

      it('specifying an empty list or string of exposed headers will result in no response header for exposed headers', function (done) {
        const options = {
          exposedHeaders: []
        };
        const req = fakeRequest('GET');
        const res = fakeResponse();
        const next = function () {
          assert.equal(res.getHeader('Access-Control-Expose-Headers'), undefined);
          done();
        };

        cors(options)(req, res, next);
      });

      it('includes credentials if explicitly enabled', function (done) {
        const cb = after(1, done);
        const req = new FakeRequest('OPTIONS');
        const res = new FakeResponse();

        res.on('finish', function () {
          assert.equal(res.getHeader('Access-Control-Allow-Credentials'), 'true');
          cb();
        });

        cors({ credentials: true })(req, res, function (err) {
          cb(err || new Error('should not be called'));
        });
      });

      it('does not include credentials unless explicitly enabled', function (done) {
        const req = fakeRequest('GET');
        const res = fakeResponse();
        const next = function () {
          assert.equal(res.getHeader('Access-Control-Allow-Credentials'), undefined);
          done();
        };

        cors()(req, res, next);
      });

      it('includes maxAge when specified', function (done) {
        const cb = after(1, done);
        const req = new FakeRequest('OPTIONS');
        const res = new FakeResponse();

        res.on('finish', function () {
          assert.equal(res.getHeader('Access-Control-Max-Age'), '456');
          cb();
        });

        cors({ maxAge: 456 })(req, res, function (err) {
          cb(err || new Error('should not be called'));
        });
      });

      it('includes maxAge when specified and equals to zero', function (done) {
        const cb = after(1, done);
        const req = new FakeRequest('OPTIONS');
        const res = new FakeResponse();

        res.on('finish', function () {
          assert.equal(res.getHeader('Access-Control-Max-Age'), '0');
          cb();
        });

        cors({ maxAge: 0 })(req, res, function (err) {
          cb(err || new Error('should not be called'));
        });
      });

    });

    it('includes maxAge when specified', function (done) {
      const cb = after(1, done);
      const req = new FakeRequest('OPTIONS');
      const res = new FakeResponse();

      res.on('finish', function () {
        assert.equal(res.getHeader('Access-Control-Max-Age'), '456');
        cb();
      });

      cors({ maxAge: 456 })(req, res, function (err) {
        cb(err || new Error('should not be called'));
      });
    });

    it('includes maxAge when specified and equals to zero', function (done) {
      const cb = after(1, done);
      const req = new FakeRequest('OPTIONS');
      const res = new FakeResponse();

      res.on('finish', function () {
        assert.equal(res.getHeader('Access-Control-Max-Age'), '0');
        cb();
      });

      cors({ maxAge: 0 })(req, res, function (err) {
        cb(err || new Error('should not be called'));
      });
    });

    it('does not include maxAge unless specified', function (done) {
      // arrange
      const req = fakeRequest('GET');
      const res = fakeResponse();
      const next = function () {
        // assert
        assert.equal(res.getHeader('Access-Control-Max-Age'), undefined);
        done();
      };

      // act
      cors()(req, res, next);
    });

    describe('passing a function to build options', function () {
      it('handles options specified via callback', function (done) {
        // arrange
        const req = fakeRequest('GET');
        const res = fakeResponse();
        const delegate = function (req2, cb) {
          cb(null, {
            origin: 'delegate.com'
          });
        };
        const next = function () {
          // assert
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), 'delegate.com');
          done();
        };

        // act
        cors(delegate)(req, res, next);
      });

      it('handles options specified via callback for preflight', function (done) {
        const cb = after(1, done);
        const req = new FakeRequest('OPTIONS');
        const res = new FakeResponse();
        const delegate = function (req2, cb) {
          cb(null, {
            origin: 'delegate.com',
            maxAge: 1000
          });
        };

        res.on('finish', function () {
          assert.equal(res.getHeader('Access-Control-Allow-Origin'), 'delegate.com');
          assert.equal(res.getHeader('Access-Control-Max-Age'), '1000');
          cb();
        });

        cors(delegate)(req, res, function (err) {
          cb(err || new Error('should not be called'));
        });
      });

      it('handles error specified via callback', function (done) {
        // arrange
        const req = fakeRequest('GET');
        const res = fakeResponse();
        const delegate = function (req2, cb) {
          cb('some error');
        };
        const next = function (err) {
          // assert
          assert.equal(err, 'some error');
          done();
        };

        // act
        cors(delegate)(req, res, next);
      });
    });
  });

  function FakeRequest(method, headers) {
    this.headers = headers || {
      'origin': 'http://example.com',
      'access-control-request-headers': 'x-header-1, x-header-2'
    };
    this.method = method || 'GET';
  }

  function FakeResponse() {
    this._headers = {};
    this.statusCode = 200;
  }

  util.inherits(FakeResponse, EventEmitter);

  FakeResponse.prototype.end = function end() {
    const response = this;

    process.nextTick(function () {
      response.emit('finish');
    });
  };

  FakeResponse.prototype.getHeader = function getHeader(name) {
    const key = name.toLowerCase();
    return this._headers[key];
  };

  FakeResponse.prototype.setHeader = function setHeader(name, value) {
    const key = name.toLowerCase();
    this._headers[key] = value;
  };
})();