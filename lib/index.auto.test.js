const middlewareWrapper = require('./index');

const mockReq = { method: 'GET', headers: {} };
const mockRes = { setHeader: jest.fn(), getHeader: jest.fn().mockReturnValue(''), end: jest.fn(), statusCode: 200, writeHead: jest.fn() };
const mockNext = jest.fn();

describe('lib/index.js', () => {
  test('should exist', () => {
    expect(middlewareWrapper).toBeDefined();
  });

  test('should return a function', () => {
    const middleware = middlewareWrapper({});
    expect(typeof middleware).toBe('function');
  });

  test('should call next() when not preflight', (done) => {
    const middleware = middlewareWrapper({});
    middleware(mockReq, mockRes, (err) => {
      expect(err).toBeFalsy();
      expect(mockRes.setHeader).toHaveBeenCalledTimes(1);
      done();
    });
  });

  test('should set Access-Control-Allow-Origin header', (done) => {
    const middleware = middlewareWrapper({ origin: '*' });
    middleware(mockReq, mockRes, (err) => {
      expect(err).toBeFalsy();
      expect(mockRes.setHeader).toHaveBeenCalledTimes(1);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      done();
    });
  });

  test('should set Access-Control-Allow-Methods header', (done) => {
    const middleware = middlewareWrapper({ methods: 'GET,POST' });
    middleware(mockReq, mockRes, (err) => {
      expect(err).toBeFalsy();
      expect(mockRes.setHeader).toHaveBeenCalledTimes(2);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
      done();
    });
  });

  test('should set Access-Control-Allow-Credentials header', (done) => {
    const middleware = middlewareWrapper({ credentials: true });
    middleware(mockReq, mockRes, (err) => {
      expect(err).toBeFalsy();
      expect(mockRes.setHeader).toHaveBeenCalledTimes(2);
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
      done();
    });
  });

  test('should handle preflight request', (done) => {
    mockReq.method = 'OPTIONS';
    const middleware = middlewareWrapper({});
    middleware(mockReq, mockRes, (err) => {
      expect(err).toBeFalsy();
      expect(mockRes.setHeader).toHaveBeenCalledTimes(5);
      expect(mockRes.end).toHaveBeenCalledTimes(1);
      done();
    });
  });

  test('should handle error', (done) => {
    const middleware = middlewareWrapper({});
    const error = new Error('Test error');
    middleware(mockReq, mockRes, (err) => {
      expect(err).not.toBe(error);
      done();
    });
  });
});