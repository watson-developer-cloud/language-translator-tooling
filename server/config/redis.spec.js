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
/*eslint func-names: 0, max-nested-callbacks: 0, max-statements: 0, handle-callback-err: 0 */

// external dependencies
var chai = require('chai');
var proxyquire = require('proxyquire').noPreserveCache();
var sinon = require('sinon');
var sinonChai = require('sinon-chai');

var should = chai.should();
chai.use(sinonChai);

// test dependencies
var mocks = require('../test/mocks');


describe('/server/config/redis', function () {

  beforeEach(function () {
    this.cfenvMock = {
      getAppEnv : sinon.stub()
    };

    this.appEnvMock = {
      getService : sinon.stub()
    };

    this.cfenvMock.getAppEnv.returns(this.appEnvMock);

    this.clientMock = {
      on : sinon.spy(),
      info : sinon.stub(),
      ping : sinon.spy()
    };

    this.info = 'key1:value1\r\nkey2:value2';

    this.clientMock.info.callsArgWith(1, null, this.info);

    this.redisMock = {
      createClient : sinon.stub()
    };

    this.redisMock.createClient.returns(this.clientMock);

    this.logMock = new mocks.LogMock();

  });

  it('should not configure redis if service not available', function () {

    var redisUtil = proxyquire('./redis', {
      'redis' : this.redisMock,
      'cfenv' : this.cfenvMock,
      './log' : this.logMock
    })();

    this.appEnvMock.getService.should.have.been.calledWith('redis');
    this.redisMock.createClient.should.not.have.been.called;
    should.not.exist(redisUtil);

  });

  it('should configure redis if service is available', function () {

    var serviceConfig = {
      credentials : {
        host : 'http://test.com',
        port : 8888
      }
    };

    this.appEnvMock.getService.returns(serviceConfig);

    var redisUtil = proxyquire('./redis', {
      'redis' : this.redisMock,
      'cfenv' : this.cfenvMock,
      './log' : this.logMock
    })();

    this.appEnvMock.getService.should.have.been.calledWith('redis');
    this.redisMock.createClient.should.have.been.calledWith(serviceConfig.credentials.port, serviceConfig.credentials.host, {});
    should.exist(redisUtil);

  });

  it('should configure redis with optional password', function () {

    var serviceConfig = {
      credentials : {
        host : 'http://test.com',
        port : 8888,
        password : 'password'
      }
    };

    this.appEnvMock.getService.returns(serviceConfig);

    var redisUtil = proxyquire('./redis', {
      'redis' : this.redisMock,
      'cfenv' : this.cfenvMock,
      './log' : this.logMock
    })();

    this.appEnvMock.getService.should.have.been.calledWith('redis');
    this.redisMock.createClient.should.have.been.calledWith(serviceConfig.credentials.port, serviceConfig.credentials.host, sinon.match({'auth_pass' : serviceConfig.credentials.password}));
    should.exist(redisUtil);

  });

  it('should configure redis with provided options', function () {

    var serviceConfig = {
      credentials : {
        host : 'http://test.com',
        port : 8888,
        password : 'password'
      }
    };

    this.appEnvMock.getService.returns(serviceConfig);

    var options = {
      max_attempts : 1
    };

    var redisUtil = proxyquire('./redis', {
      'redis' : this.redisMock,
      'cfenv' : this.cfenvMock,
      './log' : this.logMock
    })(options);

    this.appEnvMock.getService.should.have.been.calledWith('redis');
    this.redisMock.createClient.should.have.been.calledWith(serviceConfig.credentials.port, serviceConfig.credentials.host, sinon.match({'auth_pass' : serviceConfig.credentials.password, max_attempts : options.max_attempts}));
    should.exist(redisUtil);

  });

  describe ('#keepAlive', function () {

    before(function () {
      this.clock = sinon.useFakeTimers();
    });

    after(function () {
      this.clock.restore();
    });

    beforeEach(function () {
      this.serviceConfig = {
        credentials : {
          host : 'http://test.com',
          port : 8888,
          password : 'password'
        }
      };

      this.appEnvMock.getService.returns(this.serviceConfig);
    });

    it('should ping redis every 10 minutes', function (done) {

      var redisUtil = proxyquire('./redis', {
        'redis' : this.redisMock,
        'cfenv' : this.cfenvMock,
        './log' : this.logMock
      })();

      this.appEnvMock.getService.should.have.been.calledWith('redis');
      this.redisMock.createClient.should.have.been.calledWith(this.serviceConfig.credentials.port, this.serviceConfig.credentials.host, sinon.match({'auth_pass' : this.serviceConfig.credentials.password}));
      should.exist(redisUtil);

      this.clock.tick(600001);

      this.clientMock.ping.should.have.been.called;
      done();

    });

    it('should ignore malformed output from ping', function (done) {

      this.clientMock.info.callsArgWith(1, null, 'key1:value1\r\nnot:expected:format\r\nkey2:value2');

      var redisUtil = proxyquire('./redis', {
        'redis' : this.redisMock,
        'cfenv' : this.cfenvMock,
        './log' : this.logMock
      })();

      this.appEnvMock.getService.should.have.been.calledWith('redis');
      this.redisMock.createClient.should.have.been.calledWith(this.serviceConfig.credentials.port, this.serviceConfig.credentials.host, sinon.match({'auth_pass' : this.serviceConfig.credentials.password}));
      should.exist(redisUtil);

      this.clock.tick(600001);

      this.clientMock.ping.should.have.been.called;
      done();

    });

    it('should log error from ping', function (done) {

      var error = {error : 'test-generated'};

      this.clientMock.info.callsArgWith(1, error);

      var redisUtil = proxyquire('./redis', {
        'redis' : this.redisMock,
        'cfenv' : this.cfenvMock,
        './log' : this.logMock
      })();

      this.appEnvMock.getService.should.have.been.calledWith('redis');
      this.redisMock.createClient.should.have.been.calledWith(this.serviceConfig.credentials.port, this.serviceConfig.credentials.host, sinon.match({'auth_pass' : this.serviceConfig.credentials.password}));
      should.exist(redisUtil);

      this.clock.tick(600001);

      this.clientMock.ping.should.have.been.called;
      done();

    });

  });

  it('should handle error', function () {

    var serviceConfig = {
      credentials : {
        host : 'http://test.com',
        port : 8888
      }
    };

    this.appEnvMock.getService.returns(serviceConfig);

    var redisUtil = proxyquire('./redis', {
      'redis' : this.redisMock,
      'cfenv' : this.cfenvMock,
      './log' : this.logMock
    })();

    var handlerType = this.clientMock.on.lastCall.args[0];
    var handlerFn = this.clientMock.on.lastCall.args[1];
    handlerType.should.be.equal('error');
    handlerFn.should.be.a('function');

    handlerFn();

    this.logMock.error.should.have.been.called;

  });


});
