(function () {

  'use strict';

  var express = require('express'),
    supertest = require('supertest'),
    cors = require('../lib'),
    path = require('path');

  var app;

  /* -------------------------------------------------------------------------- */

  app = express();

  // Apply CORS middleware before static files with dynamic origins from env
  var allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['https://myurl.com'];
  app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept']
  }));

  // Serve static files from 'public' directory
  app.use(express.static(path.join(__dirname, 'support'))); // Assuming fonts are in test/support

  /* -------------------------------------------------------------------------- */

  describe('font CORS', function () {
    it('serves .woff files with CORS headers', function (done) {
      supertest(app)
        .get('/font.woff')
        .set('Origin', 'https://myurl.com')
        .expect(200)
        .expect('Access-Control-Allow-Origin', 'https://myurl.com')
        .end(done);
    });

    it('serves .ttf files with CORS headers', function (done) {
      supertest(app)
        .get('/font.ttf')
        .set('Origin', 'https://myurl.com')
        .expect(200)
        .expect('Access-Control-Allow-Origin', 'https://myurl.com')
        .end(done);
    });

    it('serves .otf files with CORS headers', function (done) {
      supertest(app)
        .get('/font.otf')
        .set('Origin', 'https://myurl.com')
        .expect(200)
        .expect('Access-Control-Allow-Origin', 'https://myurl.com')
        .end(done);
    });

    it('serves .woff2 files with CORS headers', function (done) {
      supertest(app)
        .get('/font.woff2')
        .set('Origin', 'https://myurl.com')
        .expect(200)
        .expect('Access-Control-Allow-Origin', 'https://myurl.com')
        .end(done);
    });

    it('blocks font requests from disallowed origins', function (done) {
      supertest(app)
        .get('/font.woff')
        .set('Origin', 'https://badorigin.com')
        .expect(200) // Static file still served, but without CORS header
        .expect(function (res) {
          if (res.headers['access-control-allow-origin']) {
            throw new Error('CORS header should not be present for disallowed origin');
          }
        })
        .end(done);
    });
  });

}());
