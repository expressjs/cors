(function () {
  /*global describe, it*/

  'use strict';

  var cors = require('../lib');

  var fakeRequest = function (headers) {
      return {
        headers: headers || {
          'origin': 'http://www.request.com'
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

  describe('mismatchContinue', function () {
    it('doesn\'t shortcircuit requests with missing origins by default', function (done) {
      // arrange
      var req, res, next;
      req = fakeRequest({});
      res = fakeResponse();
      res.end = function () {
        // assert
        done('should not be called');
      };
      next = function () {
        // assert
        done();
      };

      // act
      cors()(req, res, next);
    });

    it('doesn\'t shortcircuit requests with mismatching origins by default', function (done) {
      // arrange
      var req, res, next;
      req = fakeRequest();
      res = fakeResponse();
      res.end = function () {
        // assert
        done('should not be called');
      };
      next = function () {
        // assert
        done();
      };

      // act
      cors({
        origin: 'http://example.com'
      })(req, res, next);
    });

    it('shortcircuits requests with missing origins with `mismatchContinue: false`', function (done) {
      // arrange
      var req, res, next;
      req = fakeRequest({});
      res = fakeResponse();
      res.end = function () {
        // assert
        res.statusCode.should.equal(400);
        done();
      };
      next = function () {
        // assert
        done('should not be called');
      };

      // act
      cors({
        origin: 'http://example.com',
        mismatchContinue: false
      })(req, res, next);
    });

    it('shortcircuits requests with mismatching origins with `mismatchContinue: false`', function (done) {
      // arrange
      var req, res, next;
      req = fakeRequest();
      res = fakeResponse();
      res.end = function () {
        // assert
        res.statusCode.should.equal(400);
        done();
      };
      next = function () {
        // assert
        done('should not be called');
      };

      // act
      cors({
        origin: 'http://example.com',
        mismatchContinue: false
      })(req, res, next);
    });

    it('can configure mismatch response status code', function (done) {
      // arrange
      var req, res, next;
      req = fakeRequest();
      res = fakeResponse();
      res.end = function () {
        // assert
        res.statusCode.should.equal(401);
        done();
      };
      next = function () {
        // assert
        done('should not be called');
      };

      // act
      cors({
        origin: 'http://example.com',
        mismatchContinue: false,
        mismatchStatus: 401
      })(req, res, next);
    });

    it('matches request origin against regexp', function(done) {
      var req = fakeRequest();
      var res = fakeResponse();
      var options = {
        origin: /^(.+\.)?request.com$/,
        mismatchContinue: false
      };

      res.end = function () {
        // assert
        done('should not be called');
      };
      var next = function () {
        // assert
        done();
      };

      // act
      cors(options)(req, res, next);
    });

    it('matches request origin against array of origin checks', function(done) {
      var req = fakeRequest();
      var res = fakeResponse();
      var options = { origin: [ /foo\.com$/, 'request.com' ] };
      res.end = function () {
        // assert
        done('should not be called');
      };
      var next = function () {
        // assert
        done();
      };

      // act
      cors(options)(req, res, next);
    });

    it('doesn\'t match request origin against array of invalid origin checks', function(done) {
      var req = fakeRequest();
      var res = fakeResponse();
      var options = {
        origin: [ /foo\.com$/, 'bar.com' ],
        mismatchContinue: false
      };
      res.end = function () {
        // assert
        res.statusCode.should.equal(400);
        done();
      };
      var next = function () {
        // assert
        done('should not be called');
      };
      cors(options)(req, res, next);
    });

    it('should not shortcircuit when callback returns true', function (done) {
      var req, res, next, options;
      options = {
        origin: function (sentOrigin, cb) {
          cb(null, true);
        },
        mismatchContinue: false
      };
      req = fakeRequest();
      res = fakeResponse();
      next = function () {
        done();
      };

      cors(options)(req, res, next);
    });

    it('should shortcircuit when callback returns false', function (done) {
      var req, res, next, options;
      options = {
        origin: function (sentOrigin, cb) {
          cb(null, false);
        },
        mismatchContinue: false
      };
      req = fakeRequest();
      res = fakeResponse();

      res.end = function () {
        // assert
        res.statusCode.should.equal(400);
        done();
      };
      next = function () {
        // assert
        done('should not be called');
      };

      cors(options)(req, res, next);
    });
  });

}());
