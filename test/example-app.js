(function () {

  'use strict';

  var express = require('express'),
    supertest = require('supertest'),
    cors = require('../lib'),
    path = require('path');

  var simpleApp,
    complexApp,
    fontApp;

  /* -------------------------------------------------------------------------- */

  simpleApp = express();
  simpleApp.head('/', cors(), function (req, res) {
    res.status(204).send();
  });
  simpleApp.get('/', cors(), function (req, res) {
    res.send('Hello World (Get)');
  });
  simpleApp.post('/', cors(), function (req, res) {
    res.send('Hello World (Post)');
  });

  /* -------------------------------------------------------------------------- */

  complexApp = express();
  complexApp.options('/', cors());
  complexApp.delete('/', cors(), function (req, res) {
    res.send('Hello World (Delete)');
  });

  /* -------------------------------------------------------------------------- */

  fontApp = express();
  // Apply CORS middleware before static files with dynamic origins from env
  var allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['https://myurl.com'];
  fontApp.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept']
  }));
  // Serve static files from 'support' directory (fonts)
  fontApp.use(express.static(path.join(__dirname, 'support')));

  /* -------------------------------------------------------------------------- */

  describe('example app(s)', function () {
    describe('simple methods', function () {
      it('GET works', function (done) {
        supertest(simpleApp)
          .get('/')
          .expect(200)
          .expect('Access-Control-Allow-Origin', '*')
          .expect('Hello World (Get)')
          .end(done)
      });
      it('HEAD works', function (done) {
        supertest(simpleApp)
          .head('/')
          .expect(204)
          .expect('Access-Control-Allow-Origin', '*')
          .end(done)
      });
      it('POST works', function (done) {
        supertest(simpleApp)
          .post('/')
          .expect(200)
          .expect('Access-Control-Allow-Origin', '*')
          .expect('Hello World (Post)')
          .end(done)
      });
    });

    describe('complex methods', function () {
      it('OPTIONS works', function (done) {
        supertest(complexApp)
          .options('/')
          .expect(204)
          .expect('Access-Control-Allow-Origin', '*')
          .end(done)
      });
      it('DELETE works', function (done) {
        supertest(complexApp)
          .del('/')
          .expect(200)
          .expect('Access-Control-Allow-Origin', '*')
          .expect('Hello World (Delete)')
          .end(done)
      });
    });

    describe('font static files', function () {
      it('serves .woff files with CORS headers', function (done) {
        supertest(fontApp)
          .get('/font.woff')
          .set('Origin', 'https://myurl.com')
          .expect(200)
          .expect('Access-Control-Allow-Origin', 'https://myurl.com')
          .end(done);
      });

      it('serves .ttf files with CORS headers', function (done) {
        supertest(fontApp)
          .get('/font.ttf')
          .set('Origin', 'https://myurl.com')
          .expect(200)
          .expect('Access-Control-Allow-Origin', 'https://myurl.com')
          .end(done);
      });

      it('serves .otf files with CORS headers', function (done) {
        supertest(fontApp)
          .get('/font.otf')
          .set('Origin', 'https://myurl.com')
          .expect(200)
          .expect('Access-Control-Allow-Origin', 'https://myurl.com')
          .end(done);
      });

      it('serves .woff2 files with CORS headers', function (done) {
        supertest(fontApp)
          .get('/font.woff2')
          .set('Origin', 'https://myurl.com')
          .expect(200)
          .expect('Access-Control-Allow-Origin', 'https://myurl.com')
          .end(done);
      });

      it('blocks font requests from disallowed origins', function (done) {
        supertest(fontApp)
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
  });

}());
