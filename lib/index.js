const path = require('path');

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
    if (interceptor.path) {
      app.use(interceptor.path, (req, res, next) => {
        req.interceptorFlags = req.interceptorFlags || [];
        req.interceptorFlags.push(interceptor.flag);
        next();
      });
    }
  });

  loadDirectory(routesDir, '', app, interceptorsMap, {
    throwError: !!throwError,
  });
};
