'use strict';

var assert = require('assert');
var cors = require('..');

var EventEmitter = require('events').EventEmitter;
var util = require('util');

var FakeRequest = function (method, headers) {
  this.headers = headers || {
    'origin': 'http://example.com',
    'access-control-request-headers': 'x-header-1, x-header-2'
  };
  this.method = method || 'GET';
};

var FakeResponse = function () {
  this._headers = {};
  this.statusCode = 200;
};

util.inherits(FakeResponse, EventEmitter);

FakeResponse.prototype.end = function end() {
  var response = this;

  process.nextTick(function () {
    response.emit('finish');
  });
};

FakeResponse.prototype.getHeader = function getHeader(name) {
  var key = name.toLowerCase();
  return this._headers[key];
};

FakeResponse.prototype.setHeader = function setHeader(name, value) {
  var key = name.toLowerCase();
  this._headers[key] = value;
};

describe('issue #333 - CORS requests with credentials should forbid *', function () {
  it('forbids * for Access-Control-Allow-Origin when credentials is true', function (done) {
    var req = new FakeRequest('GET');
    var res = new FakeResponse();
    var options = {
      origin: '*',
      credentials: true
    };

    cors(options)(req, res, function (err) {
      assert.ifError(err);
      // Currently, this fails (it returns '*')
      assert.notEqual(res.getHeader('Access-Control-Allow-Origin'), '*');
      done();
    });
  });

  it('forbids * for Access-Control-Allow-Methods when credentials is true', function (done) {
    var req = new FakeRequest('OPTIONS', {
      'origin': 'http://example.com',
      'access-control-request-method': 'GET'
    });
    var res = new FakeResponse();
    var options = {
      methods: '*', // if user explicitly sets *
      credentials: true
    };

    res.on('finish', function () {
      assert.notEqual(res.getHeader('Access-Control-Allow-Methods'), '*');
      done();
    });

    cors(options)(req, res, function (err) {
      done(err || new Error('should not be called'));
    });
  });

  it('forbids * for Access-Control-Allow-Headers when credentials is true', function (done) {
    var req = new FakeRequest('OPTIONS', {
      'origin': 'http://example.com',
      'access-control-request-method': 'GET',
      'access-control-request-headers': 'X-Custom'
    });
    var res = new FakeResponse();
    var options = {
      allowedHeaders: '*', // if user explicitly sets *
      credentials: true
    };

    res.on('finish', function () {
      assert.notEqual(res.getHeader('Access-Control-Allow-Headers'), '*');
      done();
    });

    cors(options)(req, res, function (err) {
      done(err || new Error('should not be called'));
    });
  });

  it('forbids * for Access-Control-Expose-Headers when credentials is true', function (done) {
    var req = new FakeRequest('GET');
    var res = new FakeResponse();
    var options = {
      exposedHeaders: '*', // if user explicitly sets *
      credentials: true
    };

    cors(options)(req, res, function (err) {
      assert.ifError(err);
      assert.notEqual(res.getHeader('Access-Control-Expose-Headers'), '*');
      done();
    });
  });
});
