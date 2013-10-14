/*jslint indent: 2*/
/*global require: true, module: true, describe: true, it: true*/

(function () {

  'use strict';

  var should = require('should'),
    cors = require('../lib'),
    fakeRequest = function () {
      var headers = {
        'origin': 'request.com',
        'access-control-request-headers': 'requestedHeader1,requestedHeader2'
      };
      return {
        headers:headers,
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
        getHeader: function(key) {
          return headers[key];
        },
        setHeader: function (key, value) {
          headers[key] = value;
          return;
        }
      };
    };

  describe('cors', function () {
    it('passes control to next middleware', function (done) {
      // arrange
      var req, res, next;
      req = fakeRequest();
      res = fakeResponse();
      next = function () {
        done();
      };

      // act
      cors()(req, res, next);
    });

    it('shortcircuits preflight requests', function (done) {
      // arrange
      var req, res, next;
      req = fakeRequest();
      req.method = 'OPTIONS';
      res = fakeResponse();
      res.end = function () {
        // assert
        res.statusCode.should.equal(204);
        done();
      };
      next = function () {
        // assert
        done('should not be called');
      };

      // act
      cors()(req, res, next);
    });

    it('no options enables default CORS to all origins', function (done) {
      // arrange
      var req, res, next;
      req = fakeRequest();
      res = fakeResponse();
      next = function () {
        // assert
        res.getHeader('Access-Control-Allow-Origin').should.equal('*');
        should.not.exist(res.getHeader('Access-Control-Allow-Methods'));
        done();
      };

      // act
      cors()(req, res, next);
    });

    it('OPTION call with no options enables default CORS to all origins and methods', function (done) {
      // arrange
      var req, res, next;
      req = fakeRequest();
      req.method = 'OPTIONS';
      res = fakeResponse();
      res.end = function () {
        // assert
        res.statusCode.should.equal(204);
        done();
      };
      next = function () {
        // assert
        res.getHeader('Access-Control-Allow-Origin').should.equal('*');
        res.getHeader('Access-Control-Allow-Methods').should.equal('GET,PUT,POST,DELETE');
        done();
      };

      // act
      cors()(req, res, next);
    });

    describe('passing static options', function () {
      it('overrides defaults', function (done) {
        // arrange
        var req, res, next, options;
        options = {
          origin: 'example.com',
          methods: ['FOO', 'bar'],
          headers: ['FIZZ', 'buzz'],
          credentials: true,
          maxAge: 123
        };
        req = fakeRequest();
        req.method = 'OPTIONS';
        res = fakeResponse();
        res.end = function () {
          // assert
          res.statusCode.should.equal(204);
          done();
        };
        next = function () {
          // assert
          res.getHeader('Access-Control-Allow-Origin').should.equal('example.com');
          res.getHeader('Access-Control-Allow-Methods').should.equal('FOO,bar');
          res.getHeader('Access-Control-Allow-Headers').should.equal('FIZZ,buzz');
          res.getHeader('Access-Control-Allow-Credentials').should.equal('true');
          res.getHeader('Access-Control-Allow-Max-Age').should.equal('123');
          done();
        };

        // act
        cors(options)(req, res, next);
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
        req = fakeRequest();
        res = fakeResponse();
        next = function () {
          // assert
          should.not.exist(res.getHeader('Access-Control-Allow-Origin'));
          should.not.exist(res.getHeader('Access-Control-Allow-Methods'));
          should.not.exist(res.getHeader('Access-Control-Allow-Headers'));
          should.not.exist(res.getHeader('Access-Control-Allow-Credentials'));
          should.not.exist(res.getHeader('Access-Control-Allow-Max-Age'));
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
        req = fakeRequest();
        res = fakeResponse();
        next = function () {
          // assert
          res.getHeader('Access-Control-Allow-Origin').should.equal('example.com');
          done();
        };

        // act
        cors(options)(req, res, next);
      });

      it('origin defaults to *', function (done) {
        // arrange
        var req, res, next, options;
        options = {
        };
        req = fakeRequest();
        res = fakeResponse();
        next = function () {
          // assert
          res.getHeader('Access-Control-Allow-Origin').should.equal('*');
          done();
        };

        // act
        cors(options)(req, res, next);
      });

      it('specifying true for origin reflects requesting origin', function (done) {
        // arrange
        var req, res, next, options;
        options = {
          origin: true
        };
        req = fakeRequest();
        res = fakeResponse();
        next = function () {
          // assert
          res.getHeader('Access-Control-Allow-Origin').should.equal('request.com');
          done();
        };

        // act
        cors(options)(req, res, next);
      });

      it('should allow origin when callback returns true', function (done) {
        var req, res, next, options;
        options = {
          origin: function (sentOrigin, cb) {
            sentOrigin.should.equal('request.com');
            cb(null, true);
          }
        };
        req = fakeRequest();
        res = fakeResponse();
        next = function () {
          res.getHeader('Access-Control-Allow-Origin').should.equal('request.com');
          done();
        };

        cors(options)(req, res, next);
      });

      it('should not allow origin when callback returns false', function (done) {
        var req, res, next, options;
        options = {
          origin: function (sentOrigin, cb) {
            sentOrigin.should.equal('request.com');
            cb(null, false);
          }
        };
        req = fakeRequest();
        res = fakeResponse();
        next = function () {
          should.not.exist(res.getHeader('Access-Control-Allow-Origin'));
          should.not.exist(res.getHeader('Access-Control-Allow-Methods'));
          should.not.exist(res.getHeader('Access-Control-Allow-Headers'));
          should.not.exist(res.getHeader('Access-Control-Allow-Credentials'));
          should.not.exist(res.getHeader('Access-Control-Allow-Max-Age'));
          done();
        };

        cors(options)(req, res, next);
      });

      it('can override methods', function (done) {
        // arrange
        var req, res, next, options;
        options = {
          methods: ['method1', 'method2']
        };
        req = fakeRequest();
        req.method = 'OPTIONS';
        res = fakeResponse();
        res.end = function () {
          // assert
          res.statusCode.should.equal(204);
          done();
        };
        next = function () {
          // assert
          res.getHeader('Access-Control-Allow-Methods').should.equal('method1,method2');
          done();
        };

        // act
        cors(options)(req, res, next);
      });

      it('methods defaults to GET, PUT, POST, DELETE', function (done) {
        // arrange
        var req, res, next, options;
        options = {
        };
        req = fakeRequest();
        req.method = 'OPTIONS';
        res = fakeResponse();
        res.end = function () {
          // assert
          res.statusCode.should.equal(204);
          done();
        };
        next = function () {
          // assert
          res.getHeader('Access-Control-Allow-Methods').should.equal('GET,PUT,POST,DELETE');
          done();
        };

        // act
        cors(options)(req, res, next);
      });

      it('can specify headers', function (done) {
        // arrange
        var req, res, options;
        options = {
          headers: ['header1', 'header2']
        };
        req = fakeRequest();
        req.method = 'OPTIONS';
        res = fakeResponse();
        res.end = function () {
          // assert
          res.getHeader('Access-Control-Allow-Headers').should.equal('header1,header2');
          done();
        };

        // act
        cors(options)(req, res, null);
      });

      it('specifying an empty list or string of headers will result in no response header for headers', function (done) {
        // arrange
        var req, res, next, options;
        options = {
          headers: []
        };
        req = fakeRequest();
        res = fakeResponse();
        next = function () {
          // assert
          should.not.exist(res.getHeader('Access-Control-Allow-Headers'));
          done();
        };

        // act
        cors(options)(req, res, next);
      });

      it('if no headers are specified, defaults to requested headers', function (done) {
        // arrange
        var req, res, options;
        options = {
        };
        req = fakeRequest();
        req.method = 'OPTIONS';
        res = fakeResponse();
        res.end = function () {
          // assert
          res.getHeader('Access-Control-Allow-Headers').should.equal('requestedHeader1,requestedHeader2');
          done();
        };

        // act
        cors(options)(req, res, null);
      });

      it('includes credentials if explicitly enabled', function (done) {
        // arrange
        var req, res, options;
        options = {
          credentials: true
        };
        req = fakeRequest();
        req.method = 'OPTIONS';
        res = fakeResponse();
        res.end = function () {
          // assert
          res.getHeader('Access-Control-Allow-Credentials').should.equal('true');
          done();
        };

        // act
        cors(options)(req, res, null);
      });

      it('does not includes credentials unless explicitly enabled', function (done) {
        // arrange
        var req, res, next, options;
        options = {
        };
        req = fakeRequest();
        res = fakeResponse();
        next = function () {
          // assert
          should.not.exist(res.getHeader('Access-Control-Allow-Credentials'));
          done();
        };

        // act
        cors(options)(req, res, next);
      });

      it('includes maxAge when specified', function (done) {
        // arrange
        var req, res, options;
        options = {
          maxAge: 456
        };
        req = fakeRequest();
        req.method = 'OPTIONS';
        res = fakeResponse();
        res.end = function () {
          // assert
          res.getHeader('Access-Control-Allow-Max-Age').should.equal('456');
          done();
        };

        // act
        cors(options)(req, res, null);
      });

      it('does not includes maxAge unless specified', function (done) {
        // arrange
        var req, res, next, options;
        options = {
        };
        req = fakeRequest();
        res = fakeResponse();
        next = function () {
          // assert
          should.not.exist(res.getHeader('Access-Control-Allow-Max-Age'));
          done();
        };

        // act
        cors(options)(req, res, next);
      });
    });

    describe('passing a function to build options', function () {
      it('handles options specified via callback', function (done) {
        // arrange
        var req, res, next, delegate;
        /*jslint unparam: true*/ // `req` is part of the signature, but not used in this route
        delegate = function (req, cb) {
          cb(null, {
            origin: 'delegate.com'
          });
        };
        /*jslint unparam: false*/
        req = fakeRequest();
        res = fakeResponse();
        next = function () {
          // assert
          res.getHeader('Access-Control-Allow-Origin').should.equal('delegate.com');
          done();
        };

        // act
        cors(delegate)(req, res, next);
      });

      it('handles error specified via callback', function (done) {
        // arrange
        var req, res, next, delegate;
        /*jslint unparam: true*/ // `req` is part of the signature, but not used in this route
        delegate = function (req, cb) {
          cb('some error');
        };
        /*jslint unparam: false*/
        req = fakeRequest();
        res = fakeResponse();
        next = function (err) {
          // assert
          err.should.equal('some error');
          done();
        };

        // act
        cors(delegate)(req, res, next);
      });
    });
  });

}());

