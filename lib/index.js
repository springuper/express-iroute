const path = require('path');
const pathToRegexp = require('path-to-regexp');

const { loadDirectory } = require('./loader');

/**
 * iroute
 * @param {Object} app Express instance
 * @param {Object} options
 * @param {Array} [options.interceptors=[]] Ordered interceptor list
 * @param {String} [options.routesDir=$CWD/routes] Routes directory
 * @param {Boolean} [options.throwError=false] Throw error of loading route
 */
module.exports = (app, options) => {
  const { interceptors = [], routesDir = path.join(process.cwd(), 'routes'), throwError } = options;

  const interceptorsMap = interceptors.reduce((result, interceptor) => {
    result[interceptor.flag] = interceptor;
    return result;
  }, {});

  interceptors.forEach((interceptor) => {
    const { exact = true, flag, path: interceptorPath } = interceptor;

    if (interceptorPath) {
      let matcher = null;
      if (exact && typeof interceptorPath === 'string') {
        matcher = pathToRegexp(interceptorPath);
      }

      app.use(interceptorPath, (req, res, next) => {
        req.interceptorFlags = req.interceptorFlags || [];
        if (!matcher || matcher.exec(req.baseUrl)) {
          req.interceptorFlags.push(flag);
        }
        next();
      });
    }
  });

  loadDirectory(routesDir, '', app, interceptorsMap, {
    throwError: !!throwError,
  });
};
