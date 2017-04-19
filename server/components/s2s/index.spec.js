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
/*eslint func-names: 0, camelcase: 0, max-nested-callbacks: 0, max-statements: 0, handle-callback-err: 0 */

var url = require('url');

// external dependencies
var async = require('async');
var chai = require('chai');
var httpstatus = require('http-status');
var proxyquire = require('proxyquire').noPreserveCache();
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var uuid = require('node-uuid');

var crypto = require('../crypto');
var config = require('../../config/environment');

// test dependencies
var mocks = require('../../test/mocks');

var should = chai.should();
chai.use(sinonChai);


describe('/server/components/s2s/index', function () {

  beforeEach(function () {
    this.requestMock = sinon.stub();

    this.s2s = proxyquire('./index', {
      'request' : this.requestMock,
      '../../config/log' : new mocks.LogMock()
    });

    this.error = { error : 'test-generated' };
  });

  describe('#getServiceAccessAuthEndpoint()', function () {

    it('should return endpoint', function () {
      var req = {
        session : {
          serviceGuid : uuid.v1()
        }
      };

      var endpoint = this.s2s.getServiceAccessAuthEndpoint(req);
      endpoint.should.be.a('string');
      var parsed = url.parse(endpoint, true);
      parsed.should.have.property('query').that.is.an('object');
      parsed.query.should.have.property('client_id');
      parsed.query.should.have.property('redirect_uri');
      parsed.query.should.have.property('state');
      parsed.query.should.have.property('response_type', 'code');
      parsed.query.should.have.property('resource_service_instance_ids');

    });
  });

  describe('#getCredentialsFromSession()', function () {

    beforeEach(function () {
      this.credentials = {
        username : 'username',
        password : 'password'
      }

      this.req = {
        session : {
          serviceGuid : uuid.v1(),
          serviceUrl : 'http://test-service-instance.com',
          serviceUsername : crypto.encrypt(this.credentials.username),
          servicePassword : crypto.encrypt(this.credentials.password)
        }
      };
    });

    it('should return credentials', function () {

      this.s2s.getCredentialsFromSession(this.req, function (err, creds) {
        should.not.exist(err);
        creds.should.have.property('url', this.req.session.serviceUrl);
        creds.should.have.property('username', this.credentials.username);
        creds.should.have.property('password', this.credentials.password);
        creds.should.have.property('version', 'v2');
      }.bind(this));

    });

    it('should use LT version from environment', function () {

      var originalValue = process.env.LT_VERSION;

      var version = process.env.LT_VERSION = 'v3';

      this.s2s.getCredentialsFromSession(this.req, function (err, creds) {
        should.not.exist(err);
        creds.should.have.property('url', this.req.session.serviceUrl);
        creds.should.have.property('username', this.credentials.username);
        creds.should.have.property('password', this.credentials.password);
        creds.should.have.property('version', version);
      }.bind(this));

      if (originalValue) {
        process.env.LT_VERSION = originalValue;
      }

    });

  });


  describe('#getServiceKeys()', function () {

    beforeEach(function () {

      this.guid = uuid.v1();

      this.req = {
        query : {
          service_code : uuid.v1()
        },
        session : {
          serviceGuid : this.guid
        }
      };

      this.res = {
        redirect : sinon.spy()
      };

      this.successRedirect = '/success';
      this.failureRedirect = '/failure';

      this.serviceInstance = {
        service_key_guid : uuid.v1()
      };

      this.tokenBody = {
        service_instances : [this.serviceInstance],
        access_token : uuid.v1(),
        refresh_token : uuid.v1()
      };

      this.keyBody = {
        entity : {
          service_instance_guid : this.guid,
          credentials : {
            url : 'http://test-lt-service.com',
            username : 'username',
            password : 'password'
          }
        }
      };

      this.tokenResponse = {
        statusCode : 200
      };

      this.keyResponse = {
        statusCode : 200
      };

      this.requestMock.onCall(0).callsArgWith(1, null, this.tokenResponse, this.tokenBody);
      this.requestMock.onCall(1).callsArgWith(1, null, this.keyResponse, this.keyBody);

      this.tokenRequestExpectations = {
        url : config.endpoints.serviceprovider + '/token',
        qs : {code : sinon.match.string},
        method : 'GET',
        auth : {
          user : config.clientid,
          pass : config.secrets.client,
          sendImmediately : true
        },
        json : true
      };

      this.keyRequestExpectations = {
        url : config.endpoints.serviceprovider + '/service_keys/' + this.serviceInstance.service_key_guid,
        method : 'GET',
        auth : {
          user : config.clientid,
          pass : config.secrets.client,
          sendImmediately : true
        },
        headers : {
          'X-Bluemix-Service-Token' : this.tokenBody.access_token
        },
        json : true
      };
    });

    function validate (verifyFn, done) {
      async.until(
        function () {
          return this.res.redirect.callCount > 0;
        }.bind(this),
        function (check) {
          setTimeout(function defer () {
            check()
          }, 50);
        }.bind(this),
        function (err) {
          should.not.exist(err);
          verifyFn.call(this);
          done();
        }.bind(this));
    }

    it('should return service keys', function (done) {

      var verify = function () {
        this.requestMock.should.have.been.calledTwice;
        this.requestMock.should.have.been.calledWith(this.tokenRequestExpectations, sinon.match.func);
        this.requestMock.should.have.been.calledWith(this.keyRequestExpectations, sinon.match.func);
        this.res.redirect.should.have.been.calledWithExactly(this.successRedirect);
      };

      this.s2s.getServiceKeys(this.req, this.res, this.successRedirect, this.failureRedirect);
      validate.call(this, verify, done);
    });

    it('should return 500 if unable to convert service code', function (done) {

      var verify = function () {
        this.requestMock.should.have.been.calledOnce;
        this.requestMock.should.have.been.calledWith(this.tokenRequestExpectations, sinon.match.func);
        this.res.redirect.should.have.been.calledWithExactly(httpstatus.INTERNAL_SERVER_ERROR, this.failureRedirect);
      };

      this.requestMock.onCall(0).callsArgWith(1, this.error);

      this.s2s.getServiceKeys(this.req, this.res, this.successRedirect, this.failureRedirect);
      validate.call(this, verify, done);
    });

    it('should return status code from error if present when unable to convert service code', function (done) {

      var verify = function () {
        this.requestMock.should.have.been.calledOnce;
        this.requestMock.should.have.been.calledWith(this.tokenRequestExpectations, sinon.match.func);
        this.res.redirect.should.have.been.calledWithExactly(httpstatus.BAD_GATEWAY, this.failureRedirect);
      };

      this.tokenResponse.statusCode = httpstatus.BAD_GATEWAY;
      this.tokenBody.message = this.error.error;

      this.requestMock.onCall(0).callsArgWith(1, null, this.tokenResponse, this.tokenBody);

      this.s2s.getServiceKeys(this.req, this.res, this.successRedirect, this.failureRedirect);
      validate.call(this, verify, done);
    });

    it('should return status code of 500 when unable to convert service code and no status code present', function (done) {

      var verify = function () {
        this.requestMock.should.have.been.calledOnce;
        this.requestMock.should.have.been.calledWith(this.tokenRequestExpectations, sinon.match.func);
        this.res.redirect.should.have.been.calledWithExactly(httpstatus.INTERNAL_SERVER_ERROR, this.failureRedirect);
      };

      delete this.tokenResponse.statusCode;
      this.tokenBody.message = this.error.error;

      this.requestMock.onCall(0).callsArgWith(1, null, this.tokenResponse, this.tokenBody);

      this.s2s.getServiceKeys(this.req, this.res, this.successRedirect, this.failureRedirect);
      validate.call(this, verify, done);
    });

    it('should return 404 if service_instances attribute missing from token response', function (done) {

      var verify = function () {
        this.requestMock.should.have.been.calledOnce;
        this.requestMock.should.have.been.calledWith(this.tokenRequestExpectations, sinon.match.func);
        this.res.redirect.should.have.been.calledWithExactly(httpstatus.NOT_FOUND, this.failureRedirect);
      };

      this.tokenBody.message = this.error.error;
      delete this.tokenBody.service_instances;

      this.requestMock.onCall(0).callsArgWith(1, null, this.tokenResponse, this.tokenBody);

      this.s2s.getServiceKeys(this.req, this.res, this.successRedirect, this.failureRedirect);
      validate.call(this, verify, done);
    });

    it('should return 404 if service_instances attribute is empty array', function (done) {

      var verify = function () {
        this.requestMock.should.have.been.calledOnce;
        this.requestMock.should.have.been.calledWith(this.tokenRequestExpectations, sinon.match.func);
        this.res.redirect.should.have.been.calledWithExactly(httpstatus.NOT_FOUND, this.failureRedirect);
      };

      this.tokenBody.message = this.error.error;
      this.tokenBody.service_instances = [];

      this.requestMock.onCall(0).callsArgWith(1, null, this.tokenResponse, this.tokenBody);

      this.s2s.getServiceKeys(this.req, this.res, this.successRedirect, this.failureRedirect);
      validate.call(this, verify, done);
    });

    it('should return 500 if unable to retrieve service keys', function (done) {

      var verify = function () {
        this.requestMock.should.have.been.calledTwice;
        this.requestMock.should.have.been.calledWith(this.tokenRequestExpectations, sinon.match.func);
        this.requestMock.should.have.been.calledWith(this.keyRequestExpectations, sinon.match.func);
        this.res.redirect.should.have.been.calledWithExactly(httpstatus.INTERNAL_SERVER_ERROR, this.failureRedirect);
      };

      this.requestMock.onCall(1).callsArgWith(1, this.error);

      this.s2s.getServiceKeys(this.req, this.res, this.successRedirect, this.failureRedirect);
      validate.call(this, verify, done);
    });

    it('should return status code from error if present when unable to retrieve service keys', function (done) {

      var verify = function () {
        this.requestMock.should.have.been.calledTwice;
        this.requestMock.should.have.been.calledWith(this.tokenRequestExpectations, sinon.match.func);
        this.requestMock.should.have.been.calledWith(this.keyRequestExpectations, sinon.match.func);
        this.res.redirect.should.have.been.calledWithExactly(httpstatus.BAD_GATEWAY, this.failureRedirect);
      };

      this.keyResponse.statusCode = httpstatus.BAD_GATEWAY;
      this.keyBody.message = this.error.error;

      this.requestMock.onCall(1).callsArgWith(1, null, this.keyResponse, this.keyBody);

      this.s2s.getServiceKeys(this.req, this.res, this.successRedirect, this.failureRedirect);
      validate.call(this, verify, done);
    });

    it('should return 403 if initial serviceGuid attribute not on session', function (done) {

      var verify = function () {
        this.requestMock.should.have.been.calledTwice;
        this.requestMock.should.have.been.calledWith(this.tokenRequestExpectations, sinon.match.func);
        this.requestMock.should.have.been.calledWith(this.keyRequestExpectations, sinon.match.func);
        this.res.redirect.should.have.been.calledWithExactly(httpstatus.FORBIDDEN, this.failureRedirect);
      };

      delete this.req.session.serviceGuid;

      this.s2s.getServiceKeys(this.req, this.res, this.successRedirect, this.failureRedirect);
      validate.call(this, verify, done);
    });

    it('should return 403 if serviceGuid attribute does not match service guid of retrieved keys', function (done) {

      var verify = function () {
        this.requestMock.should.have.been.calledTwice;
        this.requestMock.should.have.been.calledWith(this.tokenRequestExpectations, sinon.match.func);
        this.requestMock.should.have.been.calledWith(this.keyRequestExpectations, sinon.match.func);
        this.res.redirect.should.have.been.calledWithExactly(httpstatus.FORBIDDEN, this.failureRedirect);
      };

      this.req.session.serviceGuid = uuid.v1();

      this.s2s.getServiceKeys(this.req, this.res, this.successRedirect, this.failureRedirect);
      validate.call(this, verify, done);
    });

  });

});
