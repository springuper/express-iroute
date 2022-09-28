# express-iroute

[![Build Status](https://travis-ci.org/springuper/express-iroute.svg?branch=master)](https://travis-ci.org/springuper/express-iroute)
[![npm version](https://badge.fury.io/js/express-iroute.svg)](https://badge.fury.io/js/express-iroute)

An express route integrated with an simple interceptor system.

## Installation

- NPM

```bash
$ npm install express-iroute
```

- Yarn

```bash
$ yarn add express-iroute
```

## Usage

## Define interceptors

As this module is primarily designed for routes integrated with interceptors, the first thing is to define interceptors.

```js
// interceptors/index.js

module.exports = [
  {
    flag: 'REQUIRE_MOBILE',
    path: '/*',
    preHandler(req, res, next) {
      if (req.headers['user-agent'].indexOf('mobile') === -1) {
        res.redirect('http://www.foo.com');
        return;
      }
      next();
    },
  },
  {
    flag: 'REQUIRE_LOGIN',
    path: /^\/(?!login)/,
    preHandler(req, res, next) {
      const userInfo = userService.getUserInfo(req);
      if (!userInfo) {
        res.redirect(`/login?redirecturl=${encodeURIComponent(req.url)}`);
        return;
      }
      next();
    },
  },
  {
    flag: 'REQUIRE_CSRF',
    preHandler(req, res, next) {
      // do some csrf check
    },
  },
];
```

### Interceptor API

`flag: String` is the identity of interceptor, used for specific route to add or ignore interceptors.

`path: String|RegExp|Array` defines paths which this interceptor should apply, following [express route path](http://expressjs.com/en/guide/routing.html#route-paths) format. If not defined, no routes will apply except some specific route configs.

`preHandler: Function` defines interceptor function, which executes before actual route handler.

## Define routes

This module heavily borrows idea and code from [express-autoroute](https://github.com/stonecircle/express-autoroute), so routes definition is exactly the same with it. Only one thing is different: you can config `interceptors` or `ignoreInterceptors` to overwrite interceptor-level configuration.

```js
// routes/login/login.js

module.exports = [
  {
    path: '/',
    interceptors: 'APPEND_CSRF',
    handler: loginGetController,
  },
  {
    path: '/',
    method: 'POST',
    interceptors: 'REQUIRE_CSRF',
    handler: loginPostController,
  },
  {
    path: '/randomcode',
    ignoreInterceptors: 'REQUIRE_LOGIN',
    handler: randomcodePngController,
  },
];
```

### Route API

Every route module can export an route object or a list of route object.

```js
// single route object

module.exports = {
  path: '/category',
  method: 'GET',
  handler(req, res, next) {
    // do something...
  },
};

// list of route objects

module.exports = [
  {
    path: '/category/:id',
    method: 'GET',
    handler(req, res, next) {
      // do something...
    },
  },
  {
    path: '/category/:id',
    method: 'POST',
    interceptors: 'REQUIRE_LOGIN',
    handler(req, res, next) {
      // do something...
    },
  },
];
```

`path: String` route path, will be prefixed with directory path.

`method: String|Array` http verb, default is 'GET'.

`interceptors: String|Array` overwrite common config, add an interceptor or some interceptors.

`ignoreInterceptors: String|Array` overwrite common config, remove an interceptor or some interceptors.

`handler: Function|Array` route handlers.

Route API is just a simple wrapper of express route methods, please refer to its [document](http://expressjs.com/en/guide/routing.html) for details.

## Make it works

```js
const express = require('express');
const iroute = require('express-iroute');

const interceptors = require('./interceptors');

const app = express();

iroute(app, {
  interceptors,
  routesDir: './routes',
});
```

## Special Thanks

Thanks for good ideas from [express-autoroute](https://github.com/stonecircle/express-autoroute) and [HandlerInterceptor](http://docs.spring.io/autorepo/docs/spring/3.2.4.RELEASE/javadoc-api/org/springframework/web/servlet/HandlerInterceptor.html) from SpringMVC.

## License

[MIT](https://github.com/pillarjs/csrf/blob/master/LICENSE)
