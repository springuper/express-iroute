'use strict';

var fs = require('fs');
var path = require('path');
var debug = require('debug')('express-iroute');

var dotFileMatch = /\/\.[^/]*$/;

function dispatch(handlers, req, res, done) {
  var i = 0;
  var next = function (err) {
    if (err) {
      done(err);
      return;
    }

    var handler = handlers[i++];
    if (!handler) {
      done();
      return;
    }

    handler(req, res, next);
  };

  next();
}

function loadDirectory(dirPath, prefix, app, interceptorsMap, options) {
  var currentFolder = dirPath + (prefix || '');
  var files = fs.readdirSync(currentFolder);

  files.forEach(function (filepath) {
    var stats = fs.statSync(currentFolder + '/' + filepath);

    if (stats.isDirectory()) {
      loadDirectory(dirPath, prefix + '/' + filepath, app, interceptorsMap, options);
    }
    else {
      loadFile(currentFolder + '/' + filepath, prefix, app, interceptorsMap, options);
    }
  });
}

function loadFile(file, prefix, app, interceptorsMap, options) {
  if (dotFileMatch.test(file)) {
    debug('Ignoring this file', file);
    return;
  }

  try {
    loadRouteObj(app, prefix, file, interceptorsMap);
  } catch (e) {
    debug('Error autoloading routes', e, file);
    if (options.throwError) {
      throw e;
    }
  }
}

function loadRouteObj(app, prefix, file, interceptorsMap) {
  if (!file.endsWith('.js')) {
    debug('Ignoring file because it doesn\'t end with .js', prefix, file);
    return;
  }

  var mod = require(file);
  var routeList = [].concat(mod.autoroute || mod);

  if (routeList.length === 0) {
    debug('Couldn\'t find route object for file. Does not expose route api.', file);
    return;
  }

  routeList.forEach(function (route) {
    var args = [prefix + (route.path.charAt(0) === '/' ? '' : '/') + route.path];
    args.push(function (req, res, next) {
      var interceptorFlags = req.interceptorFlags || [];
      // delete ignore interceptors
      if (route.ignoreInterceptors) {
        [].concat(route.ignoreInterceptors).forEach(function (ignore) {
          var index = interceptorFlags.indexOf(ignore);
          if (index !== -1) {
            interceptorFlags.splice(index, 1);
          }
        });
      }
      // add interceptors
      if (route.interceptors) {
        [].concat(route.interceptors).forEach(function (flag) {
          if (interceptorFlags.indexOf(flag) === -1) {
            interceptorFlags.push(flag);
          }
        });
      }

      debug('Valid interceptor flags', interceptorFlags);
      var interceptorHandlers = interceptorFlags.map(function (flag) {
        return interceptorsMap[flag].preHandler;
      });
      dispatch(interceptorHandlers, req, res, next);
    });
    args = args.concat(route.handler);

    [].concat(route.method || 'GET').forEach(function (method) {
      app[method.toLowerCase()].apply(app, args);
    });
  });
}

exports.loadDirectory = loadDirectory;
