/**
 * Copyright 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

'use strict';

// external dependencies
var sinon = require('sinon');
var testConstants = require('./testConstants');
var crypto = require('../components/crypto');
var _ = require('lodash');

function StoreMock() {
  this.getContainer = sinon.stub();
  this.getContainers = sinon.stub();
  this.createContainer = sinon.stub();
  this.deleteContainer = sinon.stub();
  this.storeFile = sinon.stub();
  this.getFile = sinon.stub();
  this.downloadFile = sinon.stub();
  this.deleteFile = function(container, name, callback) {
    callback(null, null);
  }
}

function LogMock() {

  this.error = sinon.spy();
  this.warn = sinon.spy();
  this.info = sinon.spy();
  this.debug = sinon.spy();
  this['@noCallThru'] = true;

  this.reset = function() {
    this.error.reset();
    this.warn.reset();
    this.info.reset();
    this.debug.reset();
  };
}
function LTComponentMock () {
  this.getModel = sinon.stub();
  this.getTrainingLog = sinon.stub();
}

function ModelStoreMock () {
  //this.update = sinon.stub();
  //this.get = sinon.stub();
}

function RequestMock () {
  this.post = sinon.stub();
  this.get = sinon.stub();
  this.del = sinon.stub();
}

function MultipartStreamMock () {
  return function (options) {
    this.addField = sinon.stub();
    this.addStream = sinon.stub();
    this.getBoundary = sinon.stub();
  }
}

function RESTMock () {
  this.ensureAuthenticated = function(req, res, next) {
    req.user = {username : 'testuser@here'};
    req.session = _.extend(req.session, {serviceUsername : crypto.encrypt('testuser'), servicePassword: crypto.encrypt('password'), serviceGuid: testConstants.testTenantId, serviceUrl: 'http://testlt.api.url/language-translator/api'});
    next();
  };

  this.ensureAuthorizedForTenant = function() {
    return function (req, res, next) {
      next();
    }
  };
}

var credentialsMock = {
  username : 'user',
  password : 'mypassword',
  url : 'http://testlt.api.url/language-translator/api',
  version : 'v2'
};

module.exports.LogMock = LogMock;
module.exports.RESTMock = RESTMock;
module.exports.StoreMock = StoreMock;
module.exports.credentialsMock = credentialsMock;
module.exports.LTComponentMock = LTComponentMock;
module.exports.ModelStoreMock = ModelStoreMock;
module.exports.RequestMock = RequestMock;
module.exports.MultipartStreamMock = MultipartStreamMock;
