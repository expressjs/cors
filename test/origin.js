(function () {

  'use strict';

  var express = require('express'),
    supertest = require('supertest'),
    cors = require('../lib'),
    assert = require('assert');


  function getApp(options){
    var app = express();

    app.options('/', cors(options));
    app.post('/', cors(options), function (req, res) {
      res.send('ok');
    });
  
    return app
  }
  /* -------------------------------------------------------------------------- */


  describe('origin', function(){
    it('empty options', function (done) {
      supertest(getApp())
        .options('/')
        .set('Origin', 'http://my-site.com')
        .expect(204)
        .expect('Access-Control-Allow-Origin', '*')
        .end(done)
    });
    
    it('same case', function (done) {
      supertest(getApp({
        origin: ['http://my-site.com']
      }))
        .options('/')
        .set('Origin', 'http://my-site.com')
        .expect(204)
        .expect('Access-Control-Allow-Origin', 'http://my-site.com')
        .end(done)
    });

    it('deifferent case', function (done) {
      supertest(getApp({
        origin: ['http://My-Site.com']
      }))
        .options('/')
        .set('Origin', 'http://my-site.com')
        .expect(204)
        .expect(function(res){
          assert.equal(res.headers['access-control-allow-origin'], 'http://my-site.com')
        })
        .end(done)
    });

    it('negative', function (done) {
      supertest(getApp({
        origin: ['http://My-Site.com1']
      }))
        .options('/')
        .set('Origin', 'http://my-site.com')
        .expect(204)
        .expect(function(res){
          assert.notEqual(res.headers['access-control-allow-origin'], 'http://my-site.com')
        })
        .end(done)
    });

    it('regex', function (done) {
      supertest(getApp({
        origin: [/.*my-site.*/]
      }))
        .options('/')
        .set('Origin', 'http://my-site.com')
        .expect(204)
        .expect(function(res){
          assert.equal(res.headers['access-control-allow-origin'], 'http://my-site.com')
        })
        .end(done)
    });

    it('negative regex', function (done) {
      supertest(getApp({
        origin: [/.*not-my-site.*/]
      }))
        .options('/')
        .set('Origin', 'http://my-site.com')
        .expect(204)
        .expect(function(res){
          assert.notEqual(res.headers['access-control-allow-origin'], 'http://my-site.com')
        })
        .end(done)
    });
  })
}());
