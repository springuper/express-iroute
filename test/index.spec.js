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

const ROUTES_DIR = path.join(__dirname, 'fixtures/routes');

describe('lib/index', () => {
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
        routesDir: path.join(__dirname, 'fixtures/not-found'),
      });
    }).to.throw(Error, /^ENOENT: no such file or directory, scandir.*/);
  });

  it('should throw up error when there is error in required files and options.throwError === true', () => {
    const iroute = require('../lib');

    expect(() => {
      iroute(app, {
        routesDir: path.join(__dirname, 'fixtures/throw-error'),
        throwError: true,
      });
    }).to.throw(Error, 'Oops');
  });

  it('should throw up nothing when there is error in required files but options.throwError === false', () => {
    const iroute = require('../lib');

    expect(() => {
      iroute(app, {
        routesDir: path.join(__dirname, 'fixtures/throw-error'),
        throwError: false,
      });
    }).not.to.throw(Error, 'Oops');
  });

  it('should throw up nothing when there is a valid "routesDir" path', () => {
    const iroute = require('../lib');

    expect(() => {
      iroute(app, {
        routesDir: ROUTES_DIR,
      });
    }).not.to.throw(Error);
  });

  it('should convert "interceptors" into "interceptorsMap" as type of "Record<flag, typeof interceptor>"', () => {
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
      routesDir: ROUTES_DIR,
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
      routesDir: ROUTES_DIR,
    });

    expect(loadDirectoryStub).to.have.been.calledWith(
      sinon.match.string,
      sinon.match.string,
      sinon.match.any,
      { A: { flag: 'A' }, B: { flag: 'B', path: '/override' } },
      sinon.match.object
    );
  });

  it('should invoke all selected flags when the request hits the path of "interceptors"', async () => {
    const iroute = require('../lib');

    iroute(app, {
      interceptors: [
        // when "interceptors" has no path but being defined in "interceptors" for each route definition
        // it should be injected into specific route
        {
          flag: 'ARTICLE',
          preHandler: (req, res, next) => {
            req.articles = [1, 2, 3];
            next();
          },
        },
        // when "interceptors" throw an error
        // it should be catch by the upcoming handlers
        {
          flag: 'AUTH',
          preHandler: (req, res, next) => {
            next(new Error('Oops'));
          },
          path: '/api/auth',
        },
        // when "interceptors" has path but being ignored in "ignoreInterceptors" for each route definition
        // it should be ignored for specific route
        {
          flag: 'POST',
          preHandler: (req, res, next) => {
            req.posts = [1, 2, 3];
            next();
          },
          path: '/api/post',
        },
        // these flags should be working
        {
          flag: 'PATH',
          path: '/api/user',
        },
        {
          flag: 'WILDCARD_PATH',
          path: '/api/user/*',
        },
        {
          flag: 'REGEXP_PATH',
          path: /^\/api\/user/,
        },
        {
          flag: 'REGEXP_PATH_NEGATIVE_LOOKAHEAD',
          preHandler: (req, res, next) => {
            next();
          },
          path: /^\/(?!api2).*\/user/,
        },
        // these flags should not be matched
        {
          flag: 'IGNORE_1',
          path: '/api/user/flag',
        },
        {
          flag: 'IGNORE_2',
          path: '/api2',
        },
      ],
      routesDir: ROUTES_DIR,
    });

    // final error handler
    app.use((req, res) => {
      res.status(500).send('Error');
    });

    // should receive array === "[1, 2, 3]" becuase "ARTICLE" interceptor has been claimed
    await supertest(app)
      .get('/api/article')
      .then((response) => {
        expect(response.body).to.deep.equal({
          articles: [1, 2, 3],
        });
      });

    // should receive "400 Authorization Failed" becuase "AUTH" interceptor has error
    await supertest(app)
      .get('/api/auth')
      .then((response) => {
        expect(response.statusCode).to.eql(400);
        expect(response.text).to.eql('Authorization Failed');
      });

    // should receive empty array becuase "POST" interceptor has been ignored
    await supertest(app)
      .get('/api/post')
      .then((response) => {
        expect(response.body).to.deep.equal({
          posts: [],
        });
      });

    await supertest(app)
      .get('/api/user')
      .then((response) => {
        expect(response.body).to.deep.equal({
          flags: 'PATH, REGEXP_PATH, REGEXP_PATH_NEGATIVE_LOOKAHEAD',
        });
      });

    await supertest(app)
      .post('/api/user/2')
      .then((response) => {
        expect(response.statusCode).to.eql(500);
        expect(response.text).to.eql('Error');
      });

    // should be working with different "HTTP Method" because "/api/user/flags" has defined method "ALL"
    await Promise.all(
      ['delete', 'get', 'post', 'put'].map((method) =>
        supertest(app)
          [method]('/api/user/flags')
          .then((response) => {
            expect(response.body).to.deep.equal({
              flags: 'PATH, WILDCARD_PATH, REGEXP_PATH, REGEXP_PATH_NEGATIVE_LOOKAHEAD',
            });
          })
      )
    );
  });

  it('should collect all selected flags even when a request hits the same flag in "interceptors"', async () => {
    const iroute = require('../lib');

    iroute(app, {
      interceptors: [
        // this flag should not be working because it has no "path" definition
        {
          flag: 'ANY',
        },
        // these flags should be working
        {
          flag: 'USER_1',
          path: '/api/user',
        },
        {
          flag: 'USER_FLAG_1',
          path: '/api/user/flags',
        },
        {
          flag: 'USER_FLAG_2',
          path: '/api/user/flags',
        },
      ],
      routesDir: ROUTES_DIR,
    });

    // should be working with different "HTTP Method" because "/api/user/flags" has defined method "ALL"
    await Promise.all(
      ['delete', 'get', 'post', 'put'].map((method) =>
        supertest(app)
          [method]('/api/user/flags')
          .then((response) => {
            expect(response.body).to.deep.equal({ flags: 'USER_1, USER_FLAG_1, USER_FLAG_2' });
          })
      )
    );
  });

  it('should ignore api definitions when it is a empty', async () => {
    const iroute = require('../lib');

    iroute(app, {
      interceptors: [],
      routesDir: path.join(__dirname, 'fixtures/empty'),
    });

    // final error handler
    app.use((req, res) => {
      res.status(500).send('Error');
    });

    await supertest(app)
      .get('/api/post')
      .then((response) => {
        expect(response.statusCode).to.eql(500);
        expect(response.text).to.eql('Error');
      });
  });

  it('should ignore api definitions when it is a dotfile', async () => {
    const iroute = require('../lib');

    iroute(app, {
      interceptors: [],
      routesDir: path.join(__dirname, 'fixtures/dotfile'),
    });

    // final error handler
    app.use((req, res) => {
      res.status(500).send('Error');
    });

    // should match with "fixtures/dotfile/api/article.js"
    await supertest(app)
      .get('/api/article')
      .then((response) => {
        expect(response.statusCode).to.eql(200);
        expect(response.text).to.eql('Ok');
      });

    // should send no request to "fixtures/dotfile/api/.post.js" because ".post.js" is a dotfile
    await supertest(app)
      .get('/api/post')
      .then((response) => {
        expect(response.statusCode).to.eql(500);
        expect(response.text).to.eql('Error');
      });
  });

  it('should only work with files that is compatible with "commonjs" module pattern', async () => {
    const iroute = require('../lib');

    iroute(app, {
      interceptors: [],
      routesDir: path.join(__dirname, 'fixtures/module-pattern'),
    });

    // final error handler
    app.use((req, res) => {
      res.status(500).send('Error');
    });

    // should match with "fixtures/module/api/article.cjs"
    await supertest(app)
      .get('/api/article')
      .then((response) => {
        expect(response.statusCode).to.eql(200);
        expect(response.text).to.eql('Ok');
      });

    // should send nothing to "fixtures/module/api/like.js" because the file is a js file with esmodule pattern
    await supertest(app)
      .get('/api/like')
      .then((response) => {
        expect(response.statusCode).to.eql(500);
        expect(response.text).to.eql('Error');
      });

    // should send nothing to "fixtures/module/api/photo.mjs" because the file is a esmodule file
    await supertest(app)
      .get('/api/photo')
      .then((response) => {
        expect(response.statusCode).to.eql(500);
        expect(response.text).to.eql('Error');
      });

    // should send nothing to "fixtures/module/api/post" because the fill has no extension
    await supertest(app)
      .get('/api/post')
      .then((response) => {
        expect(response.statusCode).to.eql(500);
        expect(response.text).to.eql('Error');
      });

    // should match with "fixtures/module/api/user.js"
    await supertest(app)
      .get('/api/user')
      .then((response) => {
        expect(response.statusCode).to.eql(200);
        expect(response.text).to.eql('Ok');
      });
  });
});
