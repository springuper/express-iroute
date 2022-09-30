const debug = require('debug')('express-iroute');
const fs = require('fs');

const dotFileMatch = /\/\.[^/]*$/;

function dispatch(preHandlers, req, res, done) {
  let i = 0;

  const next = (err) => {
    if (err) {
      done(err);
      return;
    }

    const preHandler = preHandlers[i];
    i += 1;

    if (!preHandler) {
      done();
      return;
    }

    preHandler(req, res, next);
  };

  next();
}

function loadRouteObj(app, prefix, file, interceptorsMap) {
  // only support "commonjs" module pattern
  if (!(file.endsWith('.cjs') || file.endsWith('.js'))) {
    debug("Ignoring file because it doesn't end with {.cjs,.js}", prefix, file);
    return;
  }

  const routeObject = require(file);

  const routeList = [].concat(routeObject);

  if (routeList.length === 0) {
    debug("Couldn't find any route objects from the file", file);
    return;
  }

  routeList.forEach((route) => {
    let args = [prefix + (route.path.charAt(0) === '/' ? '' : '/') + route.path];

    args.push((req, res, next) => {
      const interceptorFlags = req.interceptorFlags || [];
      // delete ignore interceptors
      if (route.ignoreInterceptors) {
        [].concat(route.ignoreInterceptors).forEach((ignore) => {
          const index = interceptorFlags.indexOf(ignore);
          if (index !== -1) {
            interceptorFlags.splice(index, 1);
          }
        });
      }
      // add interceptors
      if (route.interceptors) {
        [].concat(route.interceptors).forEach((flag) => {
          if (interceptorFlags.indexOf(flag) === -1) {
            interceptorFlags.push(flag);
          }
        });
      }

      debug('Valid interceptor flags', interceptorFlags);
      const interceptorHandlers = interceptorFlags.map((flag) => interceptorsMap[flag].preHandler);
      dispatch(interceptorHandlers, req, res, next);
    });

    args = args.concat(route.handler);

    [].concat(route.method || 'GET').forEach((method) => {
      app[method.toLowerCase()](...args);
    });
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
    debug('Errors in loading route files', e, file);
    if (options.throwError) {
      throw e;
    }
  }
}

function loadDirectory(dirPath, prefix, app, interceptorsMap, options) {
  const currentFolder = dirPath + (prefix || '');
  const files = fs.readdirSync(currentFolder);

  files.forEach((filepath) => {
    const stats = fs.statSync(`${currentFolder}/${filepath}`);

    if (stats.isDirectory()) {
      loadDirectory(dirPath, `${prefix}/${filepath}`, app, interceptorsMap, options);
    } else {
      loadFile(`${currentFolder}/${filepath}`, prefix, app, interceptorsMap, options);
    }
  });
}

exports.loadDirectory = loadDirectory;
