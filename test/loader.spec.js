const assert = require('assert');
const express = require('express');
const path = require('path');
const sinon = require('sinon');

const { loadDirectory } = require('../lib/loader');

describe('#loadDirectory', () => {
  it('should load routes from directory', () => {
    const app = express();

    const stubGet = sinon.stub(app, 'get');
    const stubPost = sinon.stub(app, 'post');

    stubGet.withArgs('api/category');
    stubPost.withArgs('api/category/:id');

    stubGet.withArgs('auth/login');

    loadDirectory(path.resolve(__dirname, 'fixtures'), '', app, {});

    assert(stubGet.withArgs('/api/category').calledOnce);
    assert(stubPost.withArgs('/api/category/:id').calledOnce);

    assert(stubGet.withArgs('/auth/login').calledOnce);
  });
});
