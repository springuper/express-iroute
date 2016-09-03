'use strict';

var loadDirectory = require('./loader').loadDirectory;

/**
 * iroute
 * @param {Object} app Express instance
 * @param {Object} options
 * @param {Array} [options.interceptors=[]] Ordered interceptor list
 * @param {String} [options.routesDir=$CWD/routes] Routes directory
 */
module.exports = function (app, options) {
    var interceptors = options.interceptors || [];
    var routesDir = options.routesDir || path.join(process.cwd(), 'routes');

    var interceptorsMap = interceptors.reduce(function (result, interceptor) {
        result[interceptor.flag] = interceptor;
        return result;
    }, {});
    interceptors.forEach(function (interceptor) {
        if (interceptor.path) {
            app.all(interceptor.path, function (req, res, next) {
                req.interceptorFlags = req.interceptorFlags || [];
                req.interceptorFlags.push(interceptor.flag);
                next();
            });
        }
    });

    loadDirectory(routesDir, '', app, interceptorsMap);
};
