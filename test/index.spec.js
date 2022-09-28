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
    interceptors: [{ flag: 'A', path: '/test' }, { flag: 'B' }],
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
    interceptors: [{ flag: 'A', path: '/test' }, { flag: 'B' }, { flag: 'B', path: '/override' }, { flag: 'A' }],
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

it('...', () => {
  const iroute = require('../lib');

  iroute(app, {
    interceptors: [
      { flag: 'REQUIRE_ANY' },
      { flag: 'REQUIRE_LOGGED_IN', path: '/api/flags' },
      { flag: 'REQUIRE_VIEW', path: '/api/flags' },
    ],
    routesDir: path.join(__dirname, 'fixtures/default_routes'),
  });

  supertest(app)
    .get('/api/flags')
    .expect(200)
    .end((err, res) => {
      expect(res.body).to.deep.equal({ flags: 'REQUIRE_LOGGED_IN, REQUIRE_VIEW' });
    });
});
