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
/*eslint func-names: 0 */
var util = require('util');
//external dependencies
var proxyquire = require('proxyquire').noPreserveCache();
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var uuid = require('node-uuid');

var should = chai.should();
chai.use(sinonChai);

// local dependencies
var env;

describe('server/config/environment', function() {

  before(function() {
    this.originalNodeEnv = process.env.NODE_ENV;
    this.originalCookieSecret = process.env.COOKIE_SECRET;
    this.originalSessionSecret = process.env.SESSION_SECRET;
  });

  after(function() {
    if (this.originalNodeEnv) {
      process.env.NODE_ENV = this.originalNodeEnv;
    }
    if (this.originalCookieSecret) {
      process.env.COOKIE_SECRET = this.originalCookieSecret;
    }
    if (this.originalSessionSecret) {
      process.env.SESSION_SECRET = this.originalSessionSecret;
    }
  });

  beforeEach(function() {

    this.envprops = {
      'test-generated': true
    };

    process.env.COOKIE_SECRET = 'cookie-secret';
    process.env.SESSION_SECRET = 'session-secret';

    this.cfenvMock = {
      getAppEnv: sinon.stub()
    };

    this.cfenvMock.getAppEnv.returns({});

    this.runTest = function runTest(verifyFn) {
      env = proxyquire('./index', {});
      verifyFn.call(this);
    };
  });

  afterEach(function() {
    delete process.env.NODE_ENV;
    delete process.env.COOKIE_SECRET;
    delete process.env.SESSION_SECRET;
  });

  it('should load development environment file when NODE_ENV unspecified', function() {
    delete process.env.NODE_ENV;

    this.runTest(function() {
      env.env.should.equal('development');
    });
  });

  it('should load development environment file', function() {
    process.env.NODE_ENV = 'development';

    this.runTest(function() {
      env.env.should.equal('development');
    });
  });

  it('should load test environment file', function() {
    process.env.NODE_ENV = 'test';

    this.runTest(function() {
      env.env.should.equal('test');
    });
  });

  it('should load production environment file', function() {
    process.env.NODE_ENV = 'production';

    this.runTest(function() {
      env.should.have.property('env', 'production');
    });
  });

  it('should load no overrides if NODE_ENV unrecognized', function() {
    process.env.NODE_ENV = 'unspecified';

    this.runTest(function() {
      env.should.have.property('env', 'unspecified');
    });
  });

  it('should default required environment variables', function() {
    process.env.NODE_ENV = 'production';

    // customEnv will have the override values
    var customEnv = proxyquire('./index', {});

    delete process.env.COOKIE_SECRET;
    delete process.env.SESSION_SECRET;

    // env will pick up the defaults

    this.runTest(function() {
      customEnv.should.have.deep.property('secrets.cookie').that.not.equals(env.secrets.cookie);
      customEnv.should.have.deep.property('secrets.session').that.not.equals(env.secrets.session);
    });
  });

  describe('#production', function() {

    before(function() {
      process.env.NODE_ENV = 'production';
      this.originalIP = process.env.IP;
      this.originalPort = process.env.PORT;
    });

    after(function() {
      if (this.originalIP) {
        process.env.IP = this.originalIP;
      }

      if (this.originalPort) {
        process.env.PORT = this.originalPort;
      }
    });

    beforeEach(function() {
      delete process.env.IP;
      delete process.env.PORT;

      this.cfenvMock = {
        getAppEnv: sinon.stub()
      };

      this.cfenvMock.getAppEnv.returns({});

    });

    afterEach(function() {
      delete process.env.IP;
      delete process.env.PORT;
    });

    it('should set production custom variables to cfenv values', function() {

      process.env.IP = '192.168.1.1';
      process.env.PORT = 9999;

      var values = {
        bind: 'test-generated',
        port: -1
      };

      this.cfenvMock.getAppEnv.returns(values);

      var prodEnv = proxyquire('./production', {
        'cfenv': this.cfenvMock
      });

      prodEnv.should.have.property('ip', values.bind);
      prodEnv.should.have.property('port', values.port);

    });

    it('should set production custom variables to environment variables', function() {
      process.env.IP = '192.168.1.1';
      process.env.PORT = 9999;

      this.cfenvMock.getAppEnv.returns({});

      var prodEnv = proxyquire('./production', {
        'cfenv': this.cfenvMock
      });

      prodEnv.should.have.property('ip', process.env.IP);
      prodEnv.should.have.property('port', process.env.PORT);

    });


    it('should set production custom variables to default values', function() {
      this.cfenvMock.getAppEnv.returns({});

      var prodEnv = proxyquire('./production', {
        'cfenv': this.cfenvMock
      });

      prodEnv.should.have.property('ip', undefined);
      prodEnv.should.have.property('port', 8080);

    });

  });


});
