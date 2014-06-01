
var http = require('http')
  , cors = require('../lib')
  , assert = require('assert')

it('should not miss data', function () {
  var server = http.createServer(function (req, res) {
    server.close()

    cors()(req, res, function () {
      process.nextTick(function () {
        var body = ''
        req.on('data', function (chunk) {
          body += chunk
        })
        req.on('end', function () {
          assert.equal(body, 'foo')
        })
      })
    })
  }).listen(function () {
    http.request({ method: 'post', host: '127.0.0.1', port: this.address().port }).end('foo')
  })
})
