(function () {

  'use strict';

  var express = require('express'),
    supertest = require('supertest'),
    cors = require('../lib');

  var simpleApp,
    complexApp;

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
  });

}());
