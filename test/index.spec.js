const chai = require('chai');
const express = require('express');
const path = require('path');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const supertest = require('supertest');

chai.use(sinonChai);
const { expect } = chai;

let app;
beforeEach(() => {
  app = express();
});

it('should throw up error "ENOENT ..." when no "routesDir" path and no "routes" under "process.cwd()"', () => {
  const iroute = require('../lib');

  expect(() => {
    iroute(app, {});
  }).to.throw(Error, /^ENOENT: no such file or directory, scandir.*/);
});

it('should throw up error "ENOENT ..." when there is a invalid "routesDir" path', () => {
  const iroute = require('../lib');

  expect(() => {
    iroute(app, {
      routesDir: path.join(__dirname, 'fixtures/not_found_routes'),
    });
  }).to.throw(Error, /^ENOENT: no such file or directory, scandir.*/);
});

it('should throw up nothing when there is a valid "routesDir" path', () => {
  const iroute = require('../lib');

  expect(() => {
    iroute(app, {
      routesDir: path.join(__dirname, 'fixtures/default_routes'),
    });
  }).not.to.throw(Error, /^ENOENT: no such file or directory, scandir.*/);
});

it('should convert "interceptors" into "interceptorsMap" as "Record<flag, typeof interceptor>"', () => {
  const loadDirectoryStub = sinon.stub();
  const iroute = proxyquire('../lib', { './loader': { loadDirectory: loadDirectoryStub } });

  iroute(app, {
    interceptors: [
      {
        flag: 'A',
        path: '/test',
      },
      {
        flag: 'B',
      },
    ],
    routesDir: path.join(__dirname, 'fixtures/default_routes'),
  });

  expect(loadDirectoryStub).to.have.been.calledWith(
    sinon.match.string,
    sinon.match.string,
    sinon.match.any,
    { A: { flag: 'A', path: '/test' }, B: { flag: 'B' } },
    sinon.match.object
  );
});

it('should keep the last interceptor with duplicated flags in "interceptors" when converting "interceptors" into "interceptorsMap"', () => {
  const loadDirectoryStub = sinon.stub();
  const iroute = proxyquire('../lib', { './loader': { loadDirectory: loadDirectoryStub } });

  iroute(app, {
    interceptors: [
      {
        flag: 'A',
        path: '/test',
      },
      {
        flag: 'B',
      },
      {
        flag: 'A',
      },
      {
        flag: 'B',
        path: '/override',
      },
    ],
    routesDir: path.join(__dirname, 'fixtures/default_routes'),
  });

  expect(loadDirectoryStub).to.have.been.calledWith(
    sinon.match.string,
    sinon.match.string,
    sinon.match.any,
    { A: { flag: 'A' }, B: { flag: 'B', path: '/override' } },
    sinon.match.object
  );
});

it('should invoke all selected flags when the request hits the partial path of "interceptors"', () => {
  const iroute = require('../lib');

  iroute(app, {
    interceptors: [
      // this flag should not be working because it has no "path" definition
      {
        flag: 'REQUIRE_ANY',
      },
      // this flag should be working
      {
        flag: 'REQUIRE_LOGGED_IN',
        path: '/api',
      },
      // these 2 flags should not be working because it doesn't match with full or partial path
      {
        flag: 'REQUIRE_VIEW',
        path: '/ap',
      },
      {
        flag: 'REQUIRE_PERMISSION',
        path: '/api/flag',
      },
    ],
    routesDir: path.join(__dirname, 'fixtures/default_routes'),
  });

  ['delete', 'get', 'post', 'put'].forEach((method) => {
    app[method]('/api/flags', (req, res) => {
      res.status(200).json({ flags: req.interceptorFlags.join(', ') });
    });

    supertest(app)
      [method]('/api/flags')
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.deep.equal({ flags: 'REQUIRE_LOGGED_IN' });
      });
  });
});

it('should invoke all selected flags when the request hits the same method and path of "interceptors"', () => {
  const iroute = require('../lib');

  iroute(app, {
    interceptors: [
      // this flag should not be working because it has no "path" definition
      {
        flag: 'REQUIRE_ANY',
      },
      // these two flags should be working
      {
        flag: 'REQUIRE_LOGGED_IN',
        path: '/api/flags',
      },
      {
        flag: 'REQUIRE_VIEW',
        path: '/api/flags',
      },
    ],
    routesDir: path.join(__dirname, 'fixtures/default_routes'),
  });

  ['delete', 'get', 'post', 'put'].forEach((method) => {
    app[method]('/api/flags', (req, res) => {
      res.status(200).json({ flags: req.interceptorFlags.join(', ') });
    });

    supertest(app)
      [method]('/api/flags')
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.deep.equal({ flags: 'REQUIRE_LOGGED_IN, REQUIRE_VIEW' });
      });
  });
});
