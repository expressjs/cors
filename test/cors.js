/*jslint nodejs: true*/

var should = require('should'),
    cors = require('../lib'),
    fakeRequest = function(){
      var _headers = {
        'origin': 'request.com',
        'access-control-request-headers': 'requestedHeader1,requestedHeader2'
      };
      return {
        header: function(key){
          var value = _headers[key.toLowerCase()];
          return value;
        }
      };
    },
    fakeResponse = function(){
      var _headers = {};
      return {
        header: function(key, value){
          if(value === undefined){
            var value = _headers[key];
            return value;
          }else{
            _headers[key] = value;
            return;
          }
        }
      };
    };

describe('cors', function(){
  it('passes control to next middleware', function(done){
    // arrange
    var req = fakeRequest();
    var res = fakeResponse();
    var next = function(){
      done();
    };

    // act
    cors()(req, res, next);
  });

  it('shortcircuits preflight requests', function(done){
    // arrange
    var req = fakeRequest();
    req.method = 'OPTIONS';
    var res = fakeResponse();
    res.send = function(code){
      // assert
      code.should.equal(204);
      done();
    };
    var next = function(){
      // assert
      done('should not be called');
    };

    // act
    cors()(req, res, next);
  });

  it('can disabled shortcircuiting preflight requests', function(done){
    // arrange
    var options = {
      enablePreflight: false
    };
    var req = fakeRequest();
    req.method = 'OPTIONS';
    var res = fakeResponse();
    res.send = function(code){
      // assert
      done('should not be called');
    };
    var next = function(){
      // assert
      done();
    };

    // act
    cors(options)(req, res, next);
  });

  it('no options enables default CORS to all origins and methods', function(done){
    // arrange
    var req = fakeRequest();
    var res = fakeResponse();
    var next = function(){
      // assert
      res.header('Access-Control-Allow-Origin').should.equal('*');
      res.header('Access-Control-Allow-Methods').should.equal('GET,PUT,POST,DELETE');
      done();
    };

    // act
    cors()(req, res, next);
  });

  describe('passing static options', function(){
    it('overrides defaults', function(done){
      // arrange
      var options = {
        origin: 'example.com',
        methods: ['FOO', 'bar'],
        headers: ['FIZZ', 'buzz'],
        credentials: true,
        maxAge: 123
      };
      var req = fakeRequest();
      var res = fakeResponse();
      var next = function(){
        // assert
        res.header('Access-Control-Allow-Origin').should.equal('example.com');
        res.header('Access-Control-Allow-Methods').should.equal('FOO,bar');
        res.header('Access-Control-Allow-Headers').should.equal('FIZZ,buzz');
        res.header('Access-Control-Allow-Credentials').should.equal('true');
        res.header('Access-Control-Allow-Max-Age').should.equal('123');
        done();
      };

      // act
      cors(options)(req, res, next);
    });

    it('origin of false disables cors', function(done){
      // arrange
      var options = {
        origin: false,
        methods: ['FOO', 'bar'],
        headers: ['FIZZ', 'buzz'],
        credentials: true,
        maxAge: 123
      };
      var req = fakeRequest();
      var res = fakeResponse();
      var next = function(){
        // assert
        should.not.exist(res.header('Access-Control-Allow-Origin'));
        should.not.exist(res.header('Access-Control-Allow-Methods'));
        should.not.exist(res.header('Access-Control-Allow-Headers'));
        should.not.exist(res.header('Access-Control-Allow-Credentials'));
        should.not.exist(res.header('Access-Control-Allow-Max-Age'));
        done();
      };

      // act
      cors(options)(req, res, next);
    });

    it('can override origin', function(done){
      // arrange
      var options = {
        origin: 'example.com'
      };
      var req = fakeRequest();
      var res = fakeResponse();
      var next = function(){
        // assert
        res.header('Access-Control-Allow-Origin').should.equal('example.com');
        done();
      };

      // act
      cors(options)(req, res, next);
    });

    it('origin defaults to *', function(done){
      // arrange
      var options = {
      };
      var req = fakeRequest();
      var res = fakeResponse();
      var next = function(){
        // assert
        res.header('Access-Control-Allow-Origin').should.equal('*');
        done();
      };

      // act
      cors(options)(req, res, next);
    });

    it('specifying true for origin reflects requesting origin', function(done){
      // arrange
      var options = {
        origin: true
      };
      var req = fakeRequest();
      var res = fakeResponse();
      var next = function(){
        // assert
        res.header('Access-Control-Allow-Origin').should.equal('request.com');
        done();
      };

      // act
      cors(options)(req, res, next);
    });

    it('can override methods', function(done){
      // arrange
      var options = {
        methods: ['method1', 'method2']
      };
      var req = fakeRequest();
      var res = fakeResponse();
      var next = function(){
        // assert
        res.header('Access-Control-Allow-Methods').should.equal('method1,method2');
        done();
      };

      // act
      cors(options)(req, res, next);
    });

    it('methods defaults to GET, PUT, POST, DELETE', function(done){
      // arrange
      var options = {
      };
      var req = fakeRequest();
      var res = fakeResponse();
      var next = function(){
        // assert
        res.header('Access-Control-Allow-Methods').should.equal('GET,PUT,POST,DELETE');
        done();
      };

      // act
      cors(options)(req, res, next);
    });

    it('can specify headers', function(done){
      // arrange
      var options = {
        headers: ['header1', 'header2']
      };
      var req = fakeRequest();
      var res = fakeResponse();
      var next = function(){
        // assert
        res.header('Access-Control-Allow-Headers').should.equal('header1,header2');
        done();
      };

      // act
      cors(options)(req, res, next);
    });

    it('specifying an empty list or string of headers will result in no response header for headers', function(done){
      // arrange
      var options = {
        headers: []
      };
      var req = fakeRequest();
      var res = fakeResponse();
      var next = function(){
        // assert
        should.not.exist(res.header('Access-Control-Allow-Headers'));
        done();
      };

      // act
      cors(options)(req, res, next);
    });

    it('if no headers are specified, defaults to requested headers', function(done){
      // arrange
      var options = {
      };
      var req = fakeRequest();
      var res = fakeResponse();
      var next = function(){
        // assert
        res.header('Access-Control-Allow-Headers').should.equal('requestedHeader1,requestedHeader2');
        done();
      };

      // act
      cors(options)(req, res, next);
    });

    it('includes credentials if explicitly enabled', function(done){
      // arrange
      var options = {
        credentials: true
      };
      var req = fakeRequest();
      var res = fakeResponse();
      var next = function(){
        // assert
        res.header('Access-Control-Allow-Credentials').should.equal('true');
        //should.not.exist(res.header('Access-Control-Allow-Credentials'));
        done();
      };

      // act
      cors(options)(req, res, next);
    });

    it('does not includes credentials unless explicitly enabled', function(done){
      // arrange
      var options = {
      };
      var req = fakeRequest();
      var res = fakeResponse();
      var next = function(){
        // assert
        should.not.exist(res.header('Access-Control-Allow-Credentials'));
        done();
      };

      // act
      cors(options)(req, res, next);
    });

    it('includes maxAge when specified', function(done){
      // arrange
      var options = {
        maxAge: 456
      };
      var req = fakeRequest();
      var res = fakeResponse();
      var next = function(){
        // assert
        res.header('Access-Control-Allow-Max-Age').should.equal('456');
        done();
      };

      // act
      cors(options)(req, res, next);
    });

    it('does not includes maxAge unless specified', function(done){
      // arrange
      var options = {
      };
      var req = fakeRequest();
      var res = fakeResponse();
      var next = function(){
        // assert
        should.not.exist(res.header('Access-Control-Allow-Max-Age'));
        done();
      };

      // act
      cors(options)(req, res, next);
    });
  });

  describe('passing a function to build options', function(){
    it('handles options specified via callback', function(done){
      // arrange
      var delegate = function(req, cb){
        cb(null, {
          origin: 'delegate.com'
        });
      };
      var req = fakeRequest();
      var res = fakeResponse();
      var next = function(){
        // assert
        res.header('Access-Control-Allow-Origin').should.equal('delegate.com');
        done();
      };

      // act
      cors(delegate)(req, res, next);
    });

    it('handles error specified via callback', function(done){
      // arrange
      var delegate = function(req, cb){
        cb('some error');
      };
      var req = fakeRequest();
      var res = fakeResponse();
      var next = function(err){
        // assert
        err.should.equal('some error');
        done();
      };

      // act
      cors(delegate)(req, res, next);
    });
  });
});
