/*jslint nodejs: true*/
/*global describe: true, it: true*/

'use strict';

var should = require('should'),
    express = require('express'),
    supertest = require('supertest'),
    cors = require('../lib');

/* -------------------------------------------------------------------------- */

var app = express(),
    corsOptions = {
      origin: true,
      methods: ['POST'],
      credentials: true,
      maxAge: 3600,
      enablePreflight: true
    };
app.post('/api/login', cors(corsOptions), function(req, res){
  res.send('LOGIN');
});

/* -------------------------------------------------------------------------- */

describe('issue  #2', function(){
  it('is fixed', function(done){
    supertest(app)
      .post('/api/login')
      .expect(200)
      .set('Origin', 'http://example.com')
      .end(function(err, res){
        should.not.exist(err);
        console.log(res.headers);
        res.headers['access-control-allow-origin'].should.eql('http://example.com');
        res.text.should.eql('LOGIN');
        done();
      });
  });
});
