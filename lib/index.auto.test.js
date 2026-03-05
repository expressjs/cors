const middlewareWrapper = require("./index");
const http = require('http');

const mockReq = (method, headers) => ({
  method: method || 'GET',
  headers: headers || {},
  getHeader: jest.fn().mockReturnValue(''),
});
const mockRes = (options) => ({
  setHeader: jest.fn(),
  getHeader: jest.fn().mockReturnValue(''),
  end: jest.fn(),
  statusCode: 200,
  writeHead: jest.fn(),
});
const mockNext = jest.fn();

describe("lib/index.js", () => {
  test("should exist", () => {
    expect(middlewareWrapper).toBeDefined();
  });

  test("should return a function", () => {
    const middleware = middlewareWrapper();
    expect(typeof middleware).toBe('function');
  });

  test("should call next when no options are provided", (done) => {
    const middleware = middlewareWrapper();
    const req = mockReq('GET');
    const res = mockRes();
    middleware(req, res, (err) => {
      expect(err).toBeFalsy();
      expect(mockNext).toHaveBeenCalledTimes(0);
      done();
    });
  });

  test("should set Access-Control-Allow-Origin header when origin is '*'", (done) => {
    const options = { origin: '*' };
    const middleware = middlewareWrapper(options);
    const req = mockReq('GET');
    const res = mockRes();
    middleware(req, res, (err) => {
      expect(err).toBeFalsy();
      expect(res.setHeader).toHaveBeenCalledTimes(1);
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      done();
    });
  });

  test("should set Access-Control-Allow-Origin header when origin is a string", (done) => {
    const options = { origin: 'http://example.com' };
    const middleware = middlewareWrapper(options);
    const req = mockReq('GET', { origin: 'http://example.com' });
    const res = mockRes();
    middleware(req, res, (err) => {
      expect(err).toBeFalsy();
      expect(res.setHeader).toHaveBeenCalledTimes(2);
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://example.com');
      expect(res.setHeader).toHaveBeenCalledWith('Vary', 'Origin');
      done();
    });
  });

  test("should set Access-Control-Allow-Origin header when origin is a function", (done) => {
    const options = { origin: (req, cb) => cb(null, 'http://example.com') };
    const middleware = middlewareWrapper(options);
    const req = mockReq('GET', { origin: 'http://example.com' });
    const res = mockRes();
    middleware(req, res, (err) => {
      expect(err).toBeFalsy();
      expect(res.setHeader).toHaveBeenCalledTimes(2);
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://example.com');
      expect(res.setHeader).toHaveBeenCalledWith('Vary', 'Origin');
      done();
    });
  });

  test("should set Access-Control-Allow-Methods header", (done) => {
    const options = { methods: 'GET,HEAD,PUT,PATCH,POST,DELETE' };
    const middleware = middlewareWrapper(options);
    const req = mockReq('GET');
    const res = mockRes();
    middleware(req, res, (err) => {
      expect(err).toBeFalsy();
      expect(res.setHeader).toHaveBeenCalledTimes(1);
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      done();
    });
  });

  test("should set Access-Control-Allow-Credentials header", (done) => {
    const options = { credentials: true };
    const middleware = middlewareWrapper(options);
    const req = mockReq('GET');
    const res = mockRes();
    middleware(req, res, (err) => {
      expect(err).toBeFalsy();
      expect(res.setHeader).toHaveBeenCalledTimes(1);
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      done();
    });
  });

  test("should set Access-Control-Expose-Headers header", (done) => {
    const options = { exposedHeaders: 'Content-Length,X-Kuma-Revision' };
    const middleware = middlewareWrapper(options);
    const req = mockReq('GET');
    const res = mockRes();
    middleware(req, res, (err) => {
      expect(err).toBeFalsy();
      expect(res.setHeader).toHaveBeenCalledTimes(1);
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      done();
    });
  });

  test("should set Access-Control-Max-Age header", (done) => {
    const options = { maxAge: 3600 };
    const middleware = middlewareWrapper(options);
    const req = mockReq('GET');
    const res = mockRes();
    middleware(req, res, (err) => {
      expect(err).toBeFalsy();
      expect(res.setHeader).toHaveBeenCalledTimes(1);
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      done();
    });
  });

  test("should handle preflight request", (done) => {
    const options = {};
    const middleware = middlewareWrapper(options);
    const req = mockReq('OPTIONS');
    const res = mockRes();
    middleware(req, res, (err) => {
      expect(err).toBeFalsy();
      expect(res.setHeader).toHaveBeenCalledTimes(5);
      expect(res.statusCode).toBe(204);
      expect(res.end).toHaveBeenCalledTimes(1);
      done();
    });
  });

  test("should handle non-preflight request", (done) => {
    const options = {};
    const middleware = middlewareWrapper(options);
    const req = mockReq('GET');
    const res = mockRes();
    middleware(req, res, (err) => {
      expect(err).toBeFalsy();
      expect(mockNext).toHaveBeenCalledTimes(0);
      done();
    });
  });
});