# express-iroute

An express route integrated with interceptor system.

# Installation

```base
npm install express-iroute
```

# Usage

## Define interceptors

As this module is primarily designed for routes integrated with interceptors, the first things are to define interceptors.

```js
// ./interceptors/index.js

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

## Define routes

This module heavily borrows idea and code from [express-autoroute](https://github.com/stonecircle/express-autoroute), so routes definition is exactly the same with it. Only one thing is different: you can config `interceptors` or `ignoreInterceptors` to overwrite interceptor-level configuration.

```
// ./routes/login/login.js

module.exports = {
    'get': {
        '/': {
            interceptors: 'APPEND_CSRF',
            handler: loginGetController,
        },
        '/randomcode': {
            ignoreInterceptors: 'REQUIRE_LOGIN',
            handler: randomcodePngController
        }
    },
    'post': {
        '/': {
            interceptors: 'REQUIRE_CSRF',
            handler: loginPostController
        }
    }
};
```

### Route API

Please refer to [express-autoroute](https://github.com/stonecircle/express-autoroute) for details.

`interceptors: String|Array` overwrite common config, add an interceptor or some interceptors.

`ignoreInterceptors: String|Array` overwrite common config, remove an interceptor or some interceptors.

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
