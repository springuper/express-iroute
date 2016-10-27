var path = require('path');
var assert = require('assert');
var sinon = require('sinon');
var express = require('express');
var loadDirectory = require('../lib/loader').loadDirectory;

describe('#loadDirectory', function () {
  it('should load routes from directory', function () {
    var app = express();
    var stubGet = sinon.stub(app, 'get');
    var stubPost = sinon.stub(app, 'post');

    stubGet.withArgs('api/category');
    stubPost.withArgs('api/category/:id');
    stubGet.withArgs('auth/login');
    
    loadDirectory(path.resolve(__dirname, 'fixtures'), '', app, {});

    assert(stubGet.withArgs('/api/category').calledOnce);
    assert(stubPost.withArgs('/api/category/:id').calledOnce);
    assert(stubGet.withArgs('/auth/login').calledOnce);
  });
});
