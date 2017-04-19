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
/*eslint func-names: 0, max-nested-callbacks: [2,10], max-statements: [2,15], handle-callback-err: 0 */

// external dependencies
var chai = require('chai');
var proxyquire = require('proxyquire').noPreserveCache();
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

var should = chai.should();
chai.use(sinonChai);

describe('/server/config/storage', function () {

  before(function () {
    this.originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
  });

  after(function () {
    if (this.originalNodeEnv) {
      process.env.NODE_ENV = this.originalNodeEnv;
    }
    process.env.OBJECT_STORAGE_SERVICE_NAME = 'ibmwatson-mt-objectstorage';
  });

  it('Use New ObjectStorage Credentials', function () {
    process.env.OBJECT_STORAGE_SERVICE_NAME = 'New Standard Object Storage';
    this.env = proxyquire('./environment/index', {});
    this.service =  proxyquire('./storage', {'./environment' : this.env});
    this.service.should.have.property('projectId', '024ed345ac9f467689d483399adea1ea');
  });

  it('Use a Non existent ObjectStorage Service name', function() {
    process.env.OBJECT_STORAGE_SERVICE_NAME = 'MISSING';
    this.env = proxyquire('./environment/index', {});
    this.service =  proxyquire('./storage', {'./environment' : this.env});
    this.service.should.be.empty;
  })

});

