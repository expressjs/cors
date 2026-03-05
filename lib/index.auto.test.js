const middlewareWrapper = require('./index');

const mockReq = (options) => ({
  method: options.method,
  headers: options.headers || {},
});

// Modified mockRes to accept an optional doneCallback and call it when res.end() is invoked.
// This is crucial for preflight (OPTIONS) requests where preflightContinue is false,
// as the middleware calls res.end() instead of next().
const mockRes = (doneCallback) => {
  const res = {
    setHeader: jest.fn(),
    getHeader: jest.fn().mockReturnValue(''), // Used by 'vary' module
    end: jest.fn(),
    statusCode: 200,
    writeHead: jest.fn(), // Not used by the middleware
  };

  // If a doneCallback is provided, call it when res.end() is invoked.
  res.end.mockImplementation(() => {
    if (doneCallback) {
      doneCallback();
    }
  });
  return res;
};

describe('middlewareWrapper', () => {
  test('should exist', () => {
    expect(middlewareWrapper).toBeDefined();
  });

  test('should return a function', () => {
    const middleware = middlewareWrapper();
    expect(typeof middleware).toBe('function');
  });

  test('should call next with no options (GET request)', (done) => {
    const middleware = middlewareWrapper();
    const req = mockReq({ method: 'GET' });
    const res = mockRes(); // next() is expected to be called, so no doneCallback for res.end()
    middleware(req, res, (err) => {
      expect(err).toBeFalsy();
      // For a GET request with default options (origin: '*'), only Access-Control-Allow-Origin is set.
      expect(res.setHeader).toHaveBeenCalledTimes(1);
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      done();
    });
  });

  test('should set Access-Control-Allow-Origin with default options (GET request)', (done) => {
    const middleware = middlewareWrapper();
    const req = mockReq({ method: 'GET', headers: { origin: 'http://example.com' } });
    const res = mockRes(); // next() is expected to be called, so no doneCallback for res.end()
    middleware(req, res, (err) => {
      expect(err).toBeFalsy();
      // For a GET request with default options (origin: '*'), only Access-Control-Allow-Origin is set.
      expect(res.setHeader).toHaveBeenCalledTimes(1);
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      done();
    });
  });

  test('should set Access-Control-Allow-Origin with custom options (GET request)', (done) => {
    const options = { origin: 'http://example.com' };
    const middleware = middlewareWrapper(options);
    const req = mockReq({ method: 'GET', headers: { origin: 'http://example.com' } });
    const res = mockRes(); // next() is expected to be called, so no doneCallback for res.end()
    middleware(req, res, (err) => {
      expect(err).toBeFalsy();
      // For a GET request with a specific origin, Access-Control-Allow-Origin and Vary: Origin are set.
      expect(res.setHeader).toHaveBeenCalledTimes(2);
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://example.com');
      expect(res.setHeader).toHaveBeenCalledWith('Vary', 'Origin');
      done();
    });
  });

  test('should NOT set Access-Control-Allow-Methods for a non-OPTIONS request with default options (GET request)', (done) => {
    const middleware = middlewareWrapper();
    const req = mockReq({ method: 'GET' });
    const res = mockRes(); // next() is expected to be called, so no doneCallback for res.end()
    middleware(req, res, (err) => {
      expect(err).toBeFalsy();
      // For a GET request, only Access-Control-Allow-Origin is set.
      expect(res.setHeader).toHaveBeenCalledTimes(1);
      expect(res.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Methods', expect.any(String));
      done();
    });
  });

  test('should NOT set Access-Control-Allow-Methods for a non-OPTIONS request with custom options (GET request)', (done) => {
    const options = { methods: 'GET,POST' };
    const middleware = middlewareWrapper(options);
    const req = mockReq({ method: 'GET' });
    const res = mockRes(); // next() is expected to be called, so no doneCallback for res.end()
    middleware(req, res, (err) => {
      expect(err).toBeFalsy();
      // For a GET request, only Access-Control-Allow-Origin is set.
      expect(res.setHeader).toHaveBeenCalledTimes(1);
      expect(res.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Methods', expect.any(String));
      done();
    });
  });

  test('should NOT set Access-Control-Allow-Credentials with default options (GET request)', (done) => {
    const middleware = middlewareWrapper();
    const req = mockReq({ method: 'GET' });
    const res = mockRes(); // next() is expected to be called, so no doneCallback for res.end()
    middleware(req, res, (err) => {
      expect(err).toBeFalsy();
      // For a GET request with default options (credentials: false), only Access-Control-Allow-Origin is set.
      expect(res.setHeader).toHaveBeenCalledTimes(1);
      expect(res.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
      done();
    });
  });

  test('should set Access-Control-Allow-Credentials with custom options (GET request)', (done) => {
    const options = { credentials: true };
    const middleware = middlewareWrapper(options);
    const req = mockReq({ method: 'GET' });
    const res = mockRes(); // next() is expected to be called, so no doneCallback for res.end()
    middleware(req, res, (err) => {
      expect(err).toBeFalsy();
      // For a GET request with credentials: true, Access-Control-Allow-Origin and Access-Control-Allow-Credentials are set.
      expect(res.setHeader).toHaveBeenCalledTimes(2);
      expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
      done();
    });
  });

  test('should handle preflight request with default options', (done) => {
    const middleware = middlewareWrapper();
    const req = mockReq({ method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'GET' } });
    const res = mockRes(done); // Pass done to mockRes, as res.end() will be called and next() will NOT be.

    // The next() callback is not expected to be called by the middleware for preflightContinue: false.
    // Assertions are placed after the middleware call, and Jest will wait for done() to be called by res.end().
    middleware(req, res, () => { /* next() is not called, so no assertions here */ });

    // Headers for OPTIONS with default options:
    // 1. Access-Control-Allow-Origin: *
    // 2. Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
    // 3. Vary: Access-Control-Request-Headers (because allowedHeaders is not specified)
    // 4. Content-Length: 0 (for 204 status)
    expect(res.setHeader).toHaveBeenCalledTimes(4);
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    expect(res.setHeader).toHaveBeenCalledWith('Vary', 'Access-Control-Request-Headers');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Length', '0');
    expect(res.statusCode).toBe(204);
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  test('should handle preflight request with custom options', (done) => {
    const options = { methods: 'GET,POST', credentials: true };
    const middleware = middlewareWrapper(options);
    const req = mockReq({ method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'GET' } });
    const res = mockRes(done); // Pass done to mockRes, as res.end() will be called and next() will NOT be.

    // The next() callback is not expected to be called by the middleware for preflightContinue: false.
    // Assertions are placed after the middleware call, and Jest will wait for done() to be called by res.end().
    middleware(req, res, () => { /* next() is not called, so no assertions here */ });

    // Headers for OPTIONS with custom options:
    // 1. Access-Control-Allow-Origin: * (origin not specified in options, so defaults to '*')
    // 2. Access-Control-Allow-Credentials: true
    // 3. Access-Control-Allow-Methods: GET,POST
    // 4. Vary: Access-Control-Request-Headers (because allowedHeaders is not specified)
    // 5. Content-Length: 0 (for 204 status)
    expect(res.setHeader).toHaveBeenCalledTimes(5);
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET,POST');
    expect(res.setHeader).toHaveBeenCalledWith('Vary', 'Access-Control-Request-Headers');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Length', '0');
    expect(res.statusCode).toBe(204);
    expect(res.end).toHaveBeenCalledTimes(1);
  });

  test('should handle error from options callback', (done) => {
    const error = new Error('Test error from options');
    const optionsDelegate = (req, cb) => {
      cb(error); // Simulate an error from the options delegate
    };
    const middleware = middlewareWrapper(optionsDelegate);
    const req = mockReq({ method: 'GET' });
    const res = mockRes(); // next(err) is expected to be called, so no doneCallback for res.end()
    middleware(req, res, (err) => {
      expect(err).toBe(error);
      expect(res.setHeader).not.toHaveBeenCalled(); // No headers should be set on error
      done();
    });
  });

  test('should handle error from origin callback', (done) => {
    const error = new Error('Test error from origin');
    const options = {
      origin: (origin, cb) => {
        cb(error); // Simulate an error from the origin delegate
      }
    };
    const middleware = middlewareWrapper(options);
    const req = mockReq({ method: 'GET', headers: { origin: 'http://example.com' } });
    const res = mockRes(); // next(err) is expected to be called, so no doneCallback for res.end()
    middleware(req, res, (err) => {
      expect(err).toBe(error);
      expect(res.setHeader).not.toHaveBeenCalled(); // No headers should be set on error
      done();
    });
  });
});