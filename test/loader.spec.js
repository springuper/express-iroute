const chai = require('chai');
const express = require('express');
const path = require('path');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const { loadDirectory } = require('../lib/loader');

chai.use(sinonChai);
const { expect } = chai;

describe('#loadDirectory', () => {
  it('should load routes from directory', () => {
    const app = express();

    const stubGet = sinon.stub(app, 'get');
    const stubPost = sinon.stub(app, 'post');

    stubGet.withArgs('api/category');
    stubGet.withArgs('auth/login');
    stubPost.withArgs('api/category/:id');

    loadDirectory(path.join(__dirname, 'fixtures/default_routes'), '', app, {});

    expect(stubGet.withArgs('/api/category')).to.have.been.calledOnce;
    expect(stubGet.withArgs('/auth/login')).to.have.been.calledOnce;
    expect(stubPost.withArgs('/api/category/:id')).to.have.been.calledOnce;
  });
});
