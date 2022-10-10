const path = require('path');
const pathToRegexp = require('path-to-regexp');
const url = require('url');

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
    // each interceptor could use "exact=false" to use the broadly url-matching pattern of "app.use"
    // it'd be "exact=true" by default to make everything compatible with previous version
    const { exact = true, flag, path: interceptorPath } = interceptor;

    if (interceptorPath) {
      // if "exact=true", then using "path-to-regexp" module to parse the "interceptorPath"
      const matcher = exact && typeof interceptorPath === 'string' ? pathToRegexp(interceptorPath, [], {}) : null;

      app.use(interceptorPath, (req, res, next) => {
        req.interceptorFlags = req.interceptorFlags || [];

        // extract the full "pathname" by parsing the "req.originalUrl" through "url.parse"
        const parsedUrl = matcher ? url.parse(req.originalUrl) : null;

        // if not parsedUrl, or the pathname is matched with target path checker, we'll push the flag in
        if (!parsedUrl || matcher.exec(parsedUrl.pathname)) {
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
