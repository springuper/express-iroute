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

function loadDirectory(dirPath, prefix, app, interceptorsMap) {
    var currentFolder = dirPath + (prefix || '');
    var files = fs.readdirSync(currentFolder);

    files.forEach(function (path) {
        var stats = fs.statSync(currentFolder + '/' + path);

        if (stats.isDirectory()) {
            loadDirectory(dirPath, prefix + '/' + path, app, interceptorsMap);
        }
        else {
            loadFile(currentFolder + '/' + path, prefix, app, interceptorsMap);
        }
    });
}

function loadFile(file, prefix, app, interceptorsMap) {
    if (dotFileMatch.test(file)) {
        debug('Ignoring this file', file);
        return;
    }

    try {
        loadRouteObj(app, prefix, file, interceptorsMap);
    } catch (e) {
        debug('Error autoloading routes', e, file);
    }
}

function loadRouteObj(app, prefix, file, interceptorsMap) {
    if (!file.endsWith('.js')) {
        debug('Ignoring file because it doesn\'t end with .js', prefix, file);
        return;
    }

    var mod = require(file);
    var routeObj = mod.autoroute || mod;

    if (!routeObj) {
        debug('Couldn\'t find route object for file. Does not expose route api.', file);
        return;
    }

    Object.keys(routeObj).forEach(function (method) {
        var routeList = routeObj[method];
        if (!routeList) {
            throw new Error('Couldn\'t load route object for file. Not defined correctly.');
        }

        Object.keys(routeList).forEach(function (path) {
            var route = routeList[path];
            if (typeof route === 'function') {
                route = {
                    handler: route,
                };
            }

            var args = [prefix + path];
            args.push(function (req, res, next) {
                var interceptorFlags = req.interceptorFlags || [];
                // 删除需要忽略的拦截器
                if (route.ignoreInterceptors) {
                    [].concat(route.ignoreInterceptors).forEach(function (ignore) {
                        var index = interceptorFlags.indexOf(ignore);
                        if (index !== -1) {
                            interceptorFlags.splice(index, 1);
                        }
                    });
                }
                // 增加指定的拦截器
                if (route.interceptors) {
                    // NOTE 逐个遍历以避免加入重复的 interceptor
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

            app[method].apply(app, args);
        });
    });
}

exports.loadDirectory = loadDirectory;
