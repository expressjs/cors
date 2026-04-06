(function () {

  'use strict';

  var express = require('express'),
    supertest = require('supertest'),
    cors = require('../lib');

  var app;

  /* -------------------------------------------------------------------------- */

  app = express();

  // Route with specific origin and credentials
  app.use('/api/secure', cors({
    origin: 'http://example.com',
    credentials: true,
    exposedHeaders: ['X-Custom-Header'],
    maxAge: 86400
  }));
  app.get('/api/secure/data', function (req, res) {
    res.json({ msg: 'secure' });
  });

  // Route with dynamic origin
  var allowedOrigins = ['http://example.com', 'http://app.example.com'];
  app.use('/api/dynamic', cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    }
  }));
  app.get('/api/dynamic/data', function (req, res) {
    res.json({ msg: 'dynamic' });
  });

  // Route with regex origin
  app.use('/api/regex', cors({
    origin: /\.example\.com$/
  }));
  app.get('/api/regex/data', function (req, res) {
    res.json({ msg: 'regex' });
  });

  // Route with array of origins
  app.use('/api/array', cors({
    origin: ['http://example.com', /\.example\.org$/]
  }));
  app.get('/api/array/data', function (req, res) {
    res.json({ msg: 'array' });
  });

  /* -------------------------------------------------------------------------- */

  describe('CORS with specific options', function () {
    describe('specific origin with credentials', function () {
      it('sets all headers for matching origin', function (done) {
        supertest(app)
          .get('/api/secure/data')
          .set('Origin', 'http://example.com')
          .expect(200)
          .expect('Access-Control-Allow-Origin', 'http://example.com')
          .expect('Access-Control-Allow-Credentials', 'true')
          .expect('Access-Control-Expose-Headers', 'X-Custom-Header')
          .expect('Vary', 'Origin')
          .end(done)
      });

      it('sets headers on preflight', function (done) {
        supertest(app)
          .options('/api/secure/data')
          .set('Origin', 'http://example.com')
          .set('Access-Control-Request-Method', 'GET')
          .expect(204)
          .expect('Access-Control-Allow-Origin', 'http://example.com')
          .expect('Access-Control-Allow-Credentials', 'true')
          .expect('Access-Control-Max-Age', '86400')
          .end(done)
      });
    });

    describe('dynamic origin', function () {
      it('allows matching origin', function (done) {
        supertest(app)
          .get('/api/dynamic/data')
          .set('Origin', 'http://example.com')
          .expect(200)
          .expect('Access-Control-Allow-Origin', 'http://example.com')
          .end(done)
      });

      it('allows second matching origin', function (done) {
        supertest(app)
          .get('/api/dynamic/data')
          .set('Origin', 'http://app.example.com')
          .expect(200)
          .expect('Access-Control-Allow-Origin', 'http://app.example.com')
          .end(done)
      });

      it('rejects non-matching origin', function (done) {
        supertest(app)
          .get('/api/dynamic/data')
          .set('Origin', 'http://evil.com')
          .expect(200)
          .expect(function (res) {
            if (res.headers['access-control-allow-origin']) {
              throw new Error('should not set Access-Control-Allow-Origin for rejected origin')
            }
          })
          .end(done)
      });
    });

    describe('regex origin', function () {
      it('allows matching origin', function (done) {
        supertest(app)
          .get('/api/regex/data')
          .set('Origin', 'http://app.example.com')
          .expect(200)
          .expect('Access-Control-Allow-Origin', 'http://app.example.com')
          .expect('Vary', 'Origin')
          .end(done)
      });

      it('rejects non-matching origin', function (done) {
        supertest(app)
          .get('/api/regex/data')
          .set('Origin', 'http://evil.com')
          .expect(200)
          .expect(function (res) {
            if (res.headers['access-control-allow-origin']) {
              throw new Error('should not set Access-Control-Allow-Origin for rejected origin')
            }
          })
          .end(done)
      });
    });

    describe('array origin', function () {
      it('allows string match from array', function (done) {
        supertest(app)
          .get('/api/array/data')
          .set('Origin', 'http://example.com')
          .expect(200)
          .expect('Access-Control-Allow-Origin', 'http://example.com')
          .end(done)
      });

      it('allows regex match from array', function (done) {
        supertest(app)
          .get('/api/array/data')
          .set('Origin', 'http://app.example.org')
          .expect(200)
          .expect('Access-Control-Allow-Origin', 'http://app.example.org')
          .end(done)
      });

      it('rejects non-matching origin', function (done) {
        supertest(app)
          .get('/api/array/data')
          .set('Origin', 'http://evil.com')
          .expect(200)
          .expect(function (res) {
            if (res.headers['access-control-allow-origin']) {
              throw new Error('should not set Access-Control-Allow-Origin for rejected origin')
            }
          })
          .end(done)
      });
    });
  });

}());
