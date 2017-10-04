(function () {

  'use strict';

  var express = require('express'),
    supertest = require('supertest'),
    cors = require('../lib');

  var app,
    corsOptions;

  /* -------------------------------------------------------------------------- */

  app = express();
  corsOptions = {
    origin: true,
    methods: ['POST'],
    credentials: true,
    maxAge: 3600
  };
  app.options('/api/login', cors(corsOptions));
  app.post('/api/login', cors(corsOptions), function (req, res) {
    res.send('LOGIN');
  });

  /* -------------------------------------------------------------------------- */

  describe('issue  #2', function () {
    it('OPTIONS works', function (done) {
      supertest(app)
        .options('/api/login')
        .set('Origin', 'http://example.com')
        .expect(204)
        .expect('Access-Control-Allow-Origin', 'http://example.com')
        .end(done)
    });
    it('POST works', function (done) {
      supertest(app)
        .post('/api/login')
        .set('Origin', 'http://example.com')
        .expect(200)
        .expect('Access-Control-Allow-Origin', 'http://example.com')
        .expect('LOGIN')
        .end(done)
    });
  });

}());
