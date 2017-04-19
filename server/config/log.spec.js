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

describe('/server/config/log', function () {

  before(function () {
    this.originalNodeEnv = process.env.NODE_ENV;
  });

  after(function () {
    if (this.originalNodeEnv) {
      process.env.NODE_ENV = this.originalNodeEnv;
    }
  });

  beforeEach(function () {
    delete process.env.NODE_ENV;

    this.bunyanMock = {
      createLogger : sinon.stub()
    };

    this.overrides = {
      'bunyan' : this.bunyanMock
    };
  });


  it('should write info to stdout in non-test', function () {

    process.env.NODE_ENV = 'production';

    var log = proxyquire('./log', this.overrides);
    this.bunyanMock.createLogger.should.have.been.calledWith(sinon.match.object);
    this.bunyanMock.createLogger.lastCall.args[0].streams.should.be.an('array').with.length(2);
    this.bunyanMock.createLogger.lastCall.args[0].streams[0].should.contain({level : 'debug'});
    this.bunyanMock.createLogger.lastCall.args[0].streams[1].should.contain({level : 'info'});

  });

  it('should not write info to stdout in test', function () {

    process.env.NODE_ENV = 'test';

    var log = proxyquire('./log', this.overrides);
    this.bunyanMock.createLogger.should.have.been.calledWith(sinon.match.object);
    this.bunyanMock.createLogger.lastCall.args[0].streams.should.be.an('array').with.length(1);
    this.bunyanMock.createLogger.lastCall.args[0].streams[0].should.contain({level : 'debug'});

  });

});
