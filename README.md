# express-iroute

[![Build Status](https://travis-ci.org/springuper/express-iroute.svg?branch=master)](https://travis-ci.org/springuper/express-iroute)
[![npm version](https://badge.fury.io/js/express-iroute.svg)](https://badge.fury.io/js/express-iroute)

An express route integrated with an simple interceptor system.

# Installation

```bash
$ npm install express-iroute
```

# Usage

## Define interceptors

As this module is primarily designed for routes integrated with interceptors, the first thing is to define interceptors.

```js
// interceptors/index.js

module.exports = [
  {
    flag: 'REQUIRE_MOBILE',
    path: '/*',
    preHandler: function (req, res, next) {
      if (req.headers['user-agent'].indexOf('mobile') === -1) {
        return res.redirect('http://www.foo.com');
      }
      next();
    }
  },
  {
    flag: 'REQUIRE_LOGIN',
    path: /^\/(?!login)/,
    preHandler: function (req, res, next) {
      var userInfo = util.getUserInfo(req);
      if (!userInfo) {
        return res.redirect('/login?redirecturl=' + encodeURIComponent(req.url));
      }
      next();
    }
  },
  {
    flag: 'REQUIRE_CSRF',
    preHandler: function (req, res, next) {
      // do some csrf check
    }
  }
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
  }
];
```

### Route API

Every route module can export an route object or a list of route object.

```js
// single route object
module.exports = {
  path: '/category',
  method: 'GET',
  handler: function (res, req, next) { ... }
};

// list of route objects
module.exports = [
  {
    path: '/category/:id',
    method: 'GET',
    handler: function (res, req, next) { ... }
  },
  {
    path: '/category/:id',
    method: 'POST',
    interceptors: 'REQUIRE_LOGIN',
    handler: function (res, req, next) { ... }
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
var express = require('express'),
  iroute = require('express-iroute'),
  interceptors = require('./interceptors');

var app = express();
iroute(app, {
  interceptors: interceptors,
  routesDir: './routes'
});
```

# Special Thanks

Thanks for good ideas from  [express-autoroute](https://github.com/stonecircle/express-autoroute) and [HandlerInterceptor](http://docs.spring.io/autorepo/docs/spring/3.2.4.RELEASE/javadoc-api/org/springframework/web/servlet/HandlerInterceptor.html) from SpringMVC.

# License

[MIT](https://github.com/pillarjs/csrf/blob/master/LICENSE)
